import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Task } from "@/types/Task";
import type { TaskStatus } from "@/types/TaskStatus";


//Normalizing data strucuture so as to do fast lookups O(1) and also support easy updates. 
type TasksById = Record<string, Task>;
//Storing the array of task ids in each column that is todo and completed status.(Helps in moving among statuses )
type ColumnOrder = Record<TaskStatus, string[]>;
//On refresh we might get tasks again so to avoid that we are stoirng ids that i have deleted in my application. 
type DeletedTaskIds = Record<string, true>;


//Boolean flag to check if we have seeded already 
type SeedMeta = {
  applied: boolean;
  provider: "dummyjson";
  appliedAt: string; // ISO
  version: number;
};

//THese is the intrface of the entire store.  
type KanbanState = {
  hasHydrated: boolean;

  tasksById: TasksById;
  columnOrder: ColumnOrder;
  deletedTaskIds: DeletedTaskIds;
  seed: SeedMeta;

  seedFromApi: (tasks: Task[]) => void;

  createTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;

  moveTask: (id: string, toStatus: TaskStatus, toIndex: number) => void;
  reorderTask: (status: TaskStatus, fromIndex: number, toIndex: number) => void;

  setHasHydrated: (value: boolean) => void;
};

//Helper functions to create empty order 
function emptyColumnOrder(): ColumnOrder {
  return { todo: [], "in-progress": [], done: [] };
}

//Helper to remove id from list( deleting, moving , changin status)
function removeId(list: string[], id: string): string[] {
  return list.filter((x) => x !== id);
}

//Helper to make sure index is within the length of the list( to avoid out of bounds errors)
function clampIndex(index: number, len: number): number {
  if (index < 0) return 0;
  if (index > len) return len;
  return index;
}

//Where we create and build the zustand store. 
export const useKanbanStore = create<KanbanState>()(
  persist(
    //set: update, get: fetch
    (set, get) => ({
      //Defines the hydrated check
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      //Initial value of hasHydrated as for first time it will be false
      hasHydrated: false,

      tasksById: {},
      columnOrder: emptyColumnOrder(),
      deletedTaskIds: {},
      seed: { applied: false, provider: "dummyjson", appliedAt: "", version: 1 },

      //Fetches the starter tasks from the DummyJson API and seeds the store. 
      seedFromApi: (tasks) => {
        //Reads the current state of the store.
        const { seed, tasksById, deletedTaskIds, columnOrder } = get();
        //If seeding is done, avoid duplication.
        if (seed.applied) return;

        //Make a shallow copy of the task dictionary and the column order. 
        const nextTasksById: TasksById = { ...tasksById };
        //Creates the copies of arrays for each column. (AS to avoid mutating the original state)
        const nextColumnOrder: ColumnOrder = {
          todo: [...columnOrder.todo],
          "in-progress": [...columnOrder["in-progress"]],
          done: [...columnOrder.done],
        };

        //Looping over all API tasks
        for (const task of tasks) {
          //If task is deleted or already exists, skip.
          if (deletedTaskIds[task.id]) continue;
          if (nextTasksById[task.id]) continue;

          //Add the task to the dictionary and the column order. 
          nextTasksById[task.id] = task;
          nextColumnOrder[task.status] = [...nextColumnOrder[task.status], task.id];
        }

        //Commiting the new seeded state into the store. 
        set({
          tasksById: nextTasksById,
          columnOrder: nextColumnOrder,
          seed: {
            applied: true,
            provider: "dummyjson",
            version: 1,
            appliedAt: new Date().toISOString(),
          },
        });
      },
      //Creates a new task in the store. 
      createTask: (task) => {
        const { tasksById, columnOrder } = get();
        if (tasksById[task.id]) return;

        //Adding the new task to the dictionary and the column order. 
        set({
          tasksById: { ...tasksById, [task.id]: task },
          columnOrder: {
            ...columnOrder,
            [task.status]: [task.id, ...columnOrder[task.status]],
          },
        });
      },

      updateTask: (id, patch) => {
        const { tasksById, columnOrder } = get();
        const existing = tasksById[id];
        if (!existing) return;

        const next: Task = { ...existing, ...patch };
        const prevStatus = existing.status;
        const nextStatus = next.status;

        let nextColumnOrder = columnOrder;

        //thIS IS IF THE STATUS OF THE TASK IS CHANGED 
        if (prevStatus !== nextStatus) {
          nextColumnOrder = {
            todo: removeId(columnOrder.todo, id),
            "in-progress": removeId(columnOrder["in-progress"], id),
            done: removeId(columnOrder.done, id),
          };
          nextColumnOrder[nextStatus] = [id, ...nextColumnOrder[nextStatus]];
        }

        //Updating the task in the dictionary and the column order. 
        set({
          tasksById: { ...tasksById, [id]: next },
          columnOrder: nextColumnOrder,
        });
      },

      //Deletes a task from the store. 
      deleteTask: (id) => {
        //Reading the current state of the store.
        const { tasksById, columnOrder, deletedTaskIds } = get();
        const existing = tasksById[id];
        if (!existing) return;

        //Removing the key id from the tasksById dictionary. 
        const { [id]: _, ...rest } = tasksById;

          //If the task was an API-seeded task, add its ID to deletedTaskIds. If it was a local task, keep the deleted list unchanged.
        const nextDeleted: DeletedTaskIds =
          existing.source === "api"
            ? { ...deletedTaskIds, [id]: (true as const) }
            : deletedTaskIds;

        //Updating the state of the store. after the deletion work. 
        set({
          tasksById: rest,
          deletedTaskIds: nextDeleted,
          columnOrder: {
            todo: removeId(columnOrder.todo, id),
            "in-progress": removeId(columnOrder["in-progress"], id),
            done: removeId(columnOrder.done, id),
          },
        });
      },

      //Editing of the status after the drag and drop ops. 
      moveTask: (id, toStatus, toIndex) => {
        const { tasksById, columnOrder } = get();
        const existing = tasksById[id];
        if (!existing) return;

        const fromStatus = existing.status;
        const fromList = removeId(columnOrder[fromStatus], id);
        const toListRaw = fromStatus === toStatus ? fromList : removeId(columnOrder[toStatus], id);

        const insertAt = clampIndex(toIndex, toListRaw.length);
        const toList = [...toListRaw.slice(0, insertAt), id, ...toListRaw.slice(insertAt)];

        set({
          tasksById: { ...tasksById, [id]: { ...existing, status: toStatus } },
          columnOrder: {
            ...columnOrder,
            [fromStatus]: fromList,
            [toStatus]: toList,
          },
        });
      },

      //Reordering a task within a column after the drag and drop ops. 
      reorderTask: (status, fromIndex, toIndex) => {
        const { columnOrder } = get();
        const list = columnOrder[status];
        if (fromIndex < 0 || fromIndex >= list.length) return;

        const next = [...list];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) return;

        const insertAt = clampIndex(toIndex, next.length);
        next.splice(insertAt, 0, moved);

        set({ columnOrder: { ...columnOrder, [status]: next } });
      },
    }),

    {
      //Name of the store and the version. 
      name: "kanban:v1",
      version: 2,//PReviously i had only todo and complete columns and that is why it is version 2. 
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          const col = state.columnOrder as Record<string, string[]> | undefined;
          if (col && !col["in-progress"]) {
            col["in-progress"] = [];
          }
        }
        return state as KanbanState;
      },

      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // safest fallback: wipe to defaults
          state?.seedFromApi([]); // no-op, but keeps type happy if you later change structure
        }
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        tasksById: state.tasksById,
        columnOrder: state.columnOrder,
        deletedTaskIds: state.deletedTaskIds,
        seed: state.seed,
      }),
    },
  ),
);
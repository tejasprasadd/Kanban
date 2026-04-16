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

type SeedMeta = {
  applied: boolean;
  provider: "dummyjson";
  appliedAt: string; // ISO
  version: number;
};

//THese are the interfaces for everything that is kept in the store. 
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

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
      hasHydrated: false,

      tasksById: {},
      columnOrder: emptyColumnOrder(),
      deletedTaskIds: {},
      seed: { applied: false, provider: "dummyjson", appliedAt: "", version: 1 },

      seedFromApi: (tasks) => {
        const { seed, tasksById, deletedTaskIds, columnOrder } = get();
        if (seed.applied) return;

        const nextTasksById: TasksById = { ...tasksById };
        const nextColumnOrder: ColumnOrder = {
          todo: [...columnOrder.todo],
          "in-progress": [...columnOrder["in-progress"]],
          done: [...columnOrder.done],
        };

        for (const task of tasks) {
          if (deletedTaskIds[task.id]) continue;
          if (nextTasksById[task.id]) continue;

          nextTasksById[task.id] = task;
          nextColumnOrder[task.status] = [...nextColumnOrder[task.status], task.id];
        }

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

      createTask: (task) => {
        const { tasksById, columnOrder } = get();
        if (tasksById[task.id]) return;

        set({
          tasksById: { ...tasksById, [task.id]: task },
          columnOrder: {
            ...columnOrder,
            [task.status]: [task.id, ...columnOrder[task.status]], // put on top; change if you prefer bottom
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

        if (prevStatus !== nextStatus) {
          nextColumnOrder = {
            todo: removeId(columnOrder.todo, id),
            "in-progress": removeId(columnOrder["in-progress"], id),
            done: removeId(columnOrder.done, id),
          };
          nextColumnOrder[nextStatus] = [id, ...nextColumnOrder[nextStatus]];
        }

        set({
          tasksById: { ...tasksById, [id]: next },
          columnOrder: nextColumnOrder,
        });
      },

      deleteTask: (id) => {
        const { tasksById, columnOrder, deletedTaskIds } = get();
        const existing = tasksById[id];
        if (!existing) return;

        const { [id]: _, ...rest } = tasksById;

        const nextDeleted: DeletedTaskIds =
          existing.source === "api"
            ? { ...deletedTaskIds, [id]: (true as const) }
            : deletedTaskIds;

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
      name: "kanban:v1",
      version: 2,
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
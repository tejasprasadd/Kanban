import type {DummyJsonTodoDto} from "../types/dummyjson/TodoDtos";
import type {Task} from "../types/Task";


//Mapper that maps dummyjson todo to task interface present in this code. 
export function mapDummyJsonTodoToTask(dto: DummyJsonTodoDto): Task {
    return {
        id: `api:dummyjson:${dto.id}`,
        todo: dto.todo,
        status: dto.completed ? "done" : "todo",
        source: "api",
        priorityDate: undefined,
    };
}

export function formatPriorityDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
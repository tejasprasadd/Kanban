import { getTodos } from "../service/DummyJsonService";
import { mapDummyJsonTodoToTask } from "../utils/helper";
import type { Task } from "../types/Task";

export async function fetchDummyJsonSeedTasks(limit?: number): Promise<Task[]> {
    const todos = await getTodos({ limit });
    return todos.todos.map(mapDummyJsonTodoToTask);
}
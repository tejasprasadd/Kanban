import { getTodos } from "../service/DummyJsonService";
import { mapDummyJsonTodoToTask } from "../utils/helper";
import type { Task } from "../types/Task";

//Getting all the tasks from the dummyJson API and mapp according to our interface. 
export async function fetchDummyJsonSeedTasks(limit?: number): Promise<Task[]> {
    const todos = await getTodos({ limit });
    return todos.todos.map(mapDummyJsonTodoToTask);
}
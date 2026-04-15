import type {DummyJsonTodoDto} from "../types/dummyjson/TodoDtos";
import type {Task} from "../types/Task";


//Mapper that maps dummyjson todo to task interface present in this code. 
export function mapDummyJsonTodoToTask(dto: DummyJsonTodoDto): Task {
    return {
        id: `api:dummyjson:${dto.id}`,
        todo: dto.todo,
        status: dto.completed ? "done" : "todo",
        source: "api",
    };
}
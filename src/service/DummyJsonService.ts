import { dummyJsonApi } from "./AxiosSetup";
import type {
    DummyJsonTodosListResponseDto,
    // DummyJsonTodoDto,
    // DummyJsonTodoAddRequestDto,
    // DummyJsonTodoUpdateRequestDto,
    // DummyJsonTodoDeleteResponseDto,
  } from "../types/dummyjson/TodoDtos";

export async function getTodos(params?:{
    limit?: number;
    skip?:number;
}): Promise<DummyJsonTodosListResponseDto>{
    const response = await dummyJsonApi.get<DummyJsonTodosListResponseDto>("/todos", {
        params
    });
    return response.data;
}


// export async function getTodobyId(id: number): Promise<DummyJsonTodoDto> {
//     const response = await dummyJsonApi.get<DummyJsonTodoDto>(`/todos/${id}`);
//     return response.data;
// }

// export async function addTodo(todo: DummyJsonTodoAddRequestDto): Promise<DummyJsonTodoDto> {
//     const response = await dummyJsonApi.post<DummyJsonTodoDto>("/todos/add", todo);
//     return response.data;
// }

// export async function updateTodo(id: number, todo: DummyJsonTodoUpdateRequestDto): Promise<DummyJsonTodoDto> {
//     const response = await dummyJsonApi.patch<DummyJsonTodoDto>(`/todos/${id}`, todo);
//     return response.data;
// }

// export async function deleteTodo(id: number): Promise<DummyJsonTodoDeleteResponseDto> {
//     const response = await dummyJsonApi.delete<DummyJsonTodoDeleteResponseDto>(`/todos/${id}`);
//     return response.data;
// }
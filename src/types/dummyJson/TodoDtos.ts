export interface DummyJsonTodoDto {
    id: number;
    todo: string;
    completed: boolean;
    userId: number;
  }
  
  export interface DummyJsonTodosListResponseDto {
    todos: DummyJsonTodoDto[];
    total: number;
    skip: number;
    limit: number;
  }
  
  export interface DummyJsonTodoAddRequestDto {
    todo: string;
    completed: boolean;
    userId: number;
  }
  
  export interface DummyJsonTodoUpdateRequestDto {
    todo?: string;
    completed?: boolean;
    userId?: number;
  }
  
  export interface DummyJsonTodoDeleteResponseDto extends DummyJsonTodoDto {
    isDeleted: boolean;
    deletedOn: string; 
  }
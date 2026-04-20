import {type TaskSource } from "./TaskSource";
import {type TaskStatus } from "./TaskStatus";

export interface Task {
  id: string;
  todo: string;
  source: TaskSource;
  status: TaskStatus;
  userId?: number;
 
  priorityDate?: string;
}
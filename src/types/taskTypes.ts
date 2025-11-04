// src/types/taskTypes.ts
  
export enum TaskStatus {
  ToDo = 1,
  Pending = 2,
  Done = 3
}
  
  // Add this new interface for API response
 export interface ApiTask {
  id: number;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  taskStatus: number; // API returns number
  priority: boolean;
  completed: boolean;
  createdDate: string;
  modifyDate: string;
  status: string;
}

export interface Task {
  id: number;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  taskStatus: TaskStatus; // App uses enum
  priority: boolean;
  completed: boolean;
  createdDate: string;
  modifyDate: string;
  status: string;
}

  export interface CreateTaskRequest {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    taskStatus: TaskStatus;
    priority: boolean;
  }
  
  export interface UpdateTaskRequest {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    taskStatus: TaskStatus;
    priority: boolean;
    completed: boolean;
  }
  
  export interface TaskCounts {
    toDoCount: number;
    inProgressCount: number;
    completedCount: number;
  }
  
  export interface TasksByDateResponse {
    tasks: Task[];
    toDoCount: number;
    inProgressCount: number;
    completedCount: number;
  }
  
  // Helper function to get status name
  export const getTaskStatusName = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.ToDo:
        return 'To Do';
      case TaskStatus.Pending:
        return 'Pending';
      case TaskStatus.Done:
        return 'Done';
      default:
        return 'Unknown';
    }
  };
  
  // Helper function to get status color
  export const getTaskStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.ToDo:
        return '#EF4444'; // Red
      case TaskStatus.Pending:
        return '#F59E0B'; // Orange
      case TaskStatus.Done:
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };
  
// Add this function to convert API response to app task
export const convertApiTaskToTask = (apiTask: ApiTask): Task => {
  return {
    ...apiTask,
    taskStatus: apiTask.taskStatus as TaskStatus // Convert number to enum
  };
};

// Add this function to convert task for API request
export const convertTaskToApiTask = (task: Task): ApiTask => {
  return {
    ...task,
    taskStatus: task.taskStatus as number // Convert enum to number
  };
};
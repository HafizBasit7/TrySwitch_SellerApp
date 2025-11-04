// src/api/taskAPI.ts
import apiClient from './axiosConfig';
import {
  Task,
  ApiTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskCounts,
  TasksByDateResponse,
  convertApiTaskToTask,
  convertTaskToApiTask
} from '../types/taskTypes';

export const taskAPI = {
  // POST - Create new task
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    try {
      console.log('🚀 Creating task:', data);
      
      const response = await apiClient.post<ApiTask>(
        '/tasks/CreateTask',
        data
      );
      
      console.log('✅ Task created successfully:', response.data);
      return convertApiTaskToTask(response.data);
    } catch (error: any) {
      console.error('❌ Create Task Error:', error);
      throw error;
    }
  },

  // POST - Update task
  updateTask: async (id: number, data: UpdateTaskRequest): Promise<void> => {
    try {
      console.log('🛠️ Updating task ID:', id, data);
      
      await apiClient.post(
        `/tasks/UpdateTask?id=${id}`,
        data
      );
      
      console.log('✅ Task updated successfully');
    } catch (error: any) {
      console.error('❌ Update Task Error:', error);
      throw error;
    }
  },

  // GET - Get task by ID
  getTaskById: async (id: number): Promise<Task> => {
    try {
      const response = await apiClient.get<ApiTask>(
        `/tasks/GetTaskById?id=${id}`
      );
      return convertApiTaskToTask(response.data);
    } catch (error: any) {
      console.error('❌ Get Task By ID Error:', error);
      throw error;
    }
  },

  // GET - Get user's tasks - FIXED
  getUserTasks: async (): Promise<Task[]> => {
    try {
      const response = await apiClient.get<ApiTask[]>(
        '/tasks/GetUserTasksAsync'
      );
      console.log('📦 Raw API tasks:', response.data);
      
      // Convert API tasks to app tasks
      const tasks = response.data.map(convertApiTaskToTask);
      console.log('📦 Converted tasks:', tasks);
      
      return tasks;
    } catch (error: any) {
      console.error('❌ Get User Tasks Error:', error);
      throw error;
    }
  },

  // GET - Get all tasks
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const response = await apiClient.get<ApiTask[]>(
        '/tasks/GetAllTasks'
      );
      return response.data.map(convertApiTaskToTask);
    } catch (error: any) {
      console.error('❌ Get All Tasks Error:', error);
      throw error;
    }
  },

  // GET - Get task counts
  getTaskCounts: async (): Promise<TaskCounts> => {
    try {
      const response = await apiClient.get<TaskCounts>(
        '/tasks/GetTaskCounts'
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Task Counts Error:', error);
      throw error;
    }
  },

  // POST - Mark task as complete - FIXED APPROACH
// src/api/taskAPI.ts - Fix the markTaskAsComplete function

// POST - Mark task as complete - PROPER FIX
markTaskAsComplete: async (id: number): Promise<void> => {
  try {
    console.log('✅ Marking task as complete:', id);
    
    // First get the current task to preserve all required fields
    const currentTask = await taskAPI.getTaskById(id);
    console.log('📋 Current task data:', currentTask);
    
    // Use UpdateTask with all required fields from the current task
    const updateData = {
      title: currentTask.title,
      description: currentTask.description,
      startDate: currentTask.startDate,
      endDate: currentTask.endDate,
      taskStatus: 3, // Done status
      priority: currentTask.priority,
      completed: true
    };
    
    console.log('📤 Sending update data:', updateData);
    
    await apiClient.post(
      `/tasks/UpdateTask?id=${id}`,
      updateData
    );
    
    console.log('✅ Task marked as complete successfully');
  } catch (error: any) {
    console.error('❌ Mark Task Complete Error:', error);
    console.error('❌ Error response:', error.response?.data);
    throw error;
  }
},

  // GET - Get tasks by start date
  getTasksByStartDate: async (startDate: string): Promise<TasksByDateResponse> => {
    try {
      const response = await apiClient.get<TasksByDateResponse>(
        `/tasks/GetTasksByStartDate?startDate=${encodeURIComponent(startDate)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Get Tasks By Start Date Error:', error);
      throw error;
    }
  },

  // POST - Delete task
  deleteTask: async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Deleting task ID:', id);
      
      await apiClient.post(
        `/tasks/DeleteTask/${id}`
      );
      
      console.log('✅ Task deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete Task Error:', error);
      throw error;
    }
  },
};
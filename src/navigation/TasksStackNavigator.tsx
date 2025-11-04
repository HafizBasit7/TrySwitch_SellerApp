// src/navigation/TasksStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MyTasksScreen from '../screens/Tasks/MyTasksScreen';
import TaskDetailScreen from '../screens/Tasks/TaskDetailScreen'; // Create this later if needed
import AddTaskScreen from '../screens/Tasks/AddTaskScreen'; // Create this later if needed
import AllTasksScreen from '../screens/Tasks/AllTaskScreen';
export type TasksStackParamList = {
  MyTasks: undefined;
  TaskDetail: { taskId: number };
  AddTask: undefined;
};

const Stack = createStackNavigator<TasksStackParamList>();

const TasksStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyTasksMain" component={MyTasksScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      <Stack.Screen name="AllTasks" component={AllTasksScreen} />
    </Stack.Navigator>
  );
};

export default TasksStackNavigator;
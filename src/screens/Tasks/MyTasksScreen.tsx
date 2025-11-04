// src/screens/Tasks/MyTasksScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { taskAPI } from '../../api/taskAPI';
import { Task, TaskStatus, getTaskStatusName } from '../../types/taskTypes';

const MyTasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  // Calculate counts from current tasks - always in sync
  const counts = {
    toDoCount: tasks.filter(task => task.taskStatus === TaskStatus.ToDo).length,
    inProgressCount: tasks.filter(task => task.taskStatus === TaskStatus.Pending).length,
    completedCount: tasks.filter(task => task.taskStatus === TaskStatus.Done).length,
  };

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      const tasksData = await taskAPI.getUserTasks();

      console.log('📦 Tasks data:', tasksData);

      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if ((error as any)?.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load tasks');
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const filterTasks = useCallback((
    taskList: Task[],
    status: TaskStatus,
    query: string
  ): void => {
    let filtered = taskList.filter((task) => task.taskStatus === status);

    if (query.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(query.toLowerCase()) ||
          task.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, []);

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
  };

  const handleStatusChange = (status: TaskStatus): void => {
    setSelectedStatus(status);
  };

  const handleCompleteTask = async (taskId: number): Promise<void> => {
    try {
      setCompletingTaskId(taskId);

      console.log('🔄 Starting complete task process for ID:', taskId);
      console.log('📊 Current tasks before optimistic update:', tasks);

      // Optimistic update - update UI immediately
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task =>
          task.id === taskId
            ? { ...task, taskStatus: TaskStatus.Done }
            : task
        );
        console.log('📊 Tasks after optimistic update:', updatedTasks);
        return updatedTasks;
      });

      // API call - wait for it to complete
      console.log('📡 Calling markTaskAsComplete API...');
      await taskAPI.markTaskAsComplete(taskId);

      console.log('✅ Task completed successfully on server');

      // Force refresh to ensure sync
      console.log('🔄 Refreshing tasks from server...');
      await fetchTasks();

    } catch (error: any) {
      console.error('❌ Complete task error:', error);
      console.error('❌ Error details:', error.response?.data);

      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, taskStatus: TaskStatus.ToDo }
            : task
        )
      );

      const errorMessage = error.response?.data?.message || 'Failed to complete task. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Optimized delete task function with immediate UI update
  const handleDeleteTask = async (taskId: number): Promise<void> => {
    // Store task for potential rollback
    const taskToDelete = tasks.find(task => task.id === taskId);

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update - remove immediately from UI
              setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

              // API call in background
              await taskAPI.deleteTask(taskId);
              console.log('✅ Task deleted successfully from server');
            } catch (error: any) {
              console.error('❌ Delete task error:', error);
              // Revert optimistic update on error
              if (taskToDelete) {
                setTasks(prevTasks => [...prevTasks, taskToDelete]);
              }
              const errorMessage = error.response?.data?.message || 'Failed to delete task. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleSeeAll = (): void => {
    // @ts-ignore - navigation type issue
    navigation.navigate('AllTasks', {
      status: selectedStatus,
      tasks: filteredTasks
    });
  };

  // Load tasks when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  // Update filtered tasks efficiently
  useEffect(() => {
    filterTasks(tasks, selectedStatus, searchQuery);
  }, [tasks, selectedStatus, searchQuery, filterTasks]);

  // Swipeable Task Component
  const SwipeableTaskCard = React.memo(({ item }: { item: Task }) => {
    const translateX = new Animated.Value(0);
    const [showComplete, setShowComplete] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const isCompleted = item.taskStatus === TaskStatus.Done;
    const isInDoneTab = selectedStatus === TaskStatus.Done;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !isCompleted, // Disable swipe for completed tasks in Done tab
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isInDoneTab && isCompleted) {
          // In Done tab, only allow left swipe for delete
          return gestureState.dx < -10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
        }
        // In other tabs, allow both directions
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isInDoneTab && isCompleted) {
          // In Done tab with completed task, only allow left swipe (delete)
          if (gestureState.dx < 0) {
            setShowComplete(false);
            setShowDelete(true);
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        } else {
          // Normal behavior for other tabs
          if (gestureState.dx > 0) {
            // Swipe right - show complete button
            setShowComplete(true);
            setShowDelete(false);
            translateX.setValue(Math.min(gestureState.dx, 80));
          } else if (gestureState.dx < 0) {
            // Swipe left - show delete button
            setShowComplete(false);
            setShowDelete(true);
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50 && !isInDoneTab) {
          // Swipe right complete (only in non-Done tabs)
          Animated.timing(translateX, {
            toValue: 210,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx < -50) {
          // Swipe left delete (allowed in all tabs)
          Animated.timing(translateX, {
            toValue: -210,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // Reset position
          resetPosition();
        }
      },
    });

    const resetPosition = () => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowComplete(false);
        setShowDelete(false);
      });
    };

    const handleComplete = () => {
      resetPosition();
      handleCompleteTask(item.id);
    };

    const handleDelete = () => {
      resetPosition();
      handleDeleteTask(item.id);
    };

    const isCompleting = completingTaskId === item.id;

    return (
      <View style={styles.swipeableContainer}>
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {showComplete && !isInDoneTab && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeAction]}
              onPress={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.completeContent}>
                  <Image
                    source={require('../../assets/icons/checkmark.png')} // ✅ your complete icon
                    style={styles.buttonIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {showDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteAction]}
              onPress={handleDelete}
            >
              <View style={styles.deleteContent}>
                <Image
                  source={require('../../assets/icons/trash.png')} // ✅ your delete icon
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.actionButtonTextD}>Delete</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>


        {/* Task Card */}
        <Animated.View
          style={[
            styles.taskCard,
            isCompleted && styles.completedTaskCard, // Green background for completed tasks
            {
              transform: [{ translateX }],
              opacity: isCompleting ? 0.7 : 1,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={() => {
              resetPosition();
              // @ts-ignore - navigation type issue
              navigation.navigate('TaskDetail', { taskId: item.id });
            }}
            activeOpacity={0.9}
            disabled={isCompleting}
          >
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle,
                  isCompleted && styles.completedTaskTitle // Different color for completed task title
                ]}>
                  {item.title || 'No Title'}
                </Text>
                <Image
                  source={item.priority
                    ? require('../../assets/icons/flag-filled.png')
                    : require('../../assets/icons/flag.png')
                  }
                  style={styles.priorityFlag}
                  resizeMode="contain"
                />
              </View>

              <Text style={[
                styles.taskDescription,
                isCompleted && styles.completedTaskDescription
              ]} numberOfLines={2}>
                {item.description || 'No description'}
              </Text>

              <View style={styles.taskFooter}>
                <View style={styles.dateContainer}>
                  <Text style={[
                    styles.dateText,
                    isCompleted && styles.completedDateText
                  ]}>
                    {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No date'}
                  </Text>
                  <Text style={[
                    styles.dateSeparator,
                    isCompleted && styles.completedDateSeparator
                  ]}> ...... </Text>
                  <Text style={[
                    styles.dateText,
                    isCompleted && styles.completedDateText
                  ]}>
                    {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'No date'}
                  </Text>
                </View>
              </View>

              {isCompleting && (
                <View style={styles.completingOverlay}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text style={styles.completingText}>Completing...</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search a task..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#6B7280"
        />
         <Image
    source={require('../../assets/icons/search.png')}
    style={styles.searchIconImage}
    resizeMode="contain"
  />
      </View>

      {/* Status Tabs */}
      <View style={styles.statusContainer}>
        {/* To Do */}
        <TouchableOpacity
          style={[
            styles.statusCard,
            selectedStatus === TaskStatus.ToDo && styles.statusCardActive,
          ]}
          onPress={() => handleStatusChange(TaskStatus.ToDo)}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/red-document.png')}
              style={styles.statusIconImage}
              resizeMode="contain"
            />
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{counts.toDoCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>To Do</Text>
        </TouchableOpacity>

        {/* Pending */}
        <TouchableOpacity
          style={[
            styles.statusCard,
            selectedStatus === TaskStatus.Pending && styles.statusCardActive,
          ]}
          onPress={() => handleStatusChange(TaskStatus.Pending)}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/yellow-pending.png')}
              style={styles.statusIconImage}
              resizeMode="contain"
            />
            <View style={styles.statusBadgeP}>
              <Text style={styles.statusBadgeText}>{counts.inProgressCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>Pending</Text>
        </TouchableOpacity>

        {/* Done */}
        <TouchableOpacity
          style={[
            styles.statusCard,
            selectedStatus === TaskStatus.Done && styles.statusCardActive,
          ]}
          onPress={() => handleStatusChange(TaskStatus.Done)}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/green-done.png')}
              style={styles.statusIconImage}
              resizeMode="contain"
            />
            <View style={styles.statusBadgeD}>
              <Text style={styles.statusBadgeText}>{counts.completedCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>Done</Text>
        </TouchableOpacity>
      </View>


      {/* Tasks Section Header with See All button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {getTaskStatusName(selectedStatus)} Tasks
        </Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? 'Try a different search' : 'Create your first task to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => <SwipeableTaskCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']}
              tintColor={'#7C3AED'}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        />
      )}

      {/* Add task button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // @ts-ignore - navigation type issue
          navigation.navigate('AddTask');
        }}
      >
        <Image
          source={require('../../assets/icons/tasks.png')}
          style={styles.addIconImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FF4500',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
 headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchContainer: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
searchIconImage: {
  width: 20,
  height: 20,
  tintColor: '#c91818ff', // makes it grey — remove if your icon is already colored
  marginLeft: 8,
},
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCardActive: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  statusIconContainer: {
    position: 'relative',
  },
  statusIcon: {
    fontSize: 24,
  },
  statusIconImage: {
    width: 32,
    height: 32,
  },

  statusBadge: {
    position: 'absolute',
    top: -10,
    right: -20,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeP: {
    position: 'absolute',
    top: -10,
    right: -20,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeD: {
    position: 'absolute',
    top: -10,
    right: -20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0540a0ff',
  },
  seeAllText: {
    fontSize: 12,
    color: 'red',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  swipeableContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 0,
  },
  actionButton: {
    width: 190,
    // justifyContent: 'center',
    // alignItems: 'center',
    borderRadius: 12,
    minHeight: 44,
  },
  completeAction: {
    backgroundColor: '#5f10b9ff',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    marginLeft: 'auto',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',


  },
  actionButtonTextD: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',

  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContent: {
    alignItems: 'flex-start', // move left
    marginLeft: 15, // control distance from left edge
    marginTop: 40,
  },

  deleteContent: {
    alignItems: 'flex-end', // move right
    marginRight: 15, // control distance from right edge
    marginTop: 40, // push icon & text slightly downward
  },

  buttonIcon: {
    width: 24,
    height: 24,
    marginBottom: 4, // space between icon and text
    tintColor: '#fff',// make sure icon color matches text
  },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  completedTaskCard: {
    backgroundColor: '#D1FAE5', // Light green background for completed tasks
    borderColor: '#10B981', // Green border for completed tasks
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    flex: 1,
  },
  completedTaskTitle: {
    color: '#065F46', // Dark green for completed task title
    textDecorationLine: 'line-through', // Optional: strikethrough for completed tasks
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  completedTaskDescription: {
    color: '#047857', // Green for completed description
    textDecorationLine: 'line-through', // Optional: strikethrough
  },
  taskFooter: {
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  completedDateText: {
    color: '#059669', // Green for completed dates
  },
  dateSeparator: {
    fontSize: 12,
    color: '#F59E0B',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  completedDateSeparator: {
    color: '#10B981', // Green for completed separator
  },
  priorityFlag: {
    width: 16,
    height: 16,
    marginLeft: 8,
    marginTop: 2,
  },
  completingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  completingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#7C3AED',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  addIconImage: {
    width: 28,
    height: 28,
    tintColor: '#fff', // makes icon white — remove if your icon is colored
  },
});

export default MyTasksScreen;
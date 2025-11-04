// src/screens/AllTasksScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { taskAPI } from '../../api/taskAPI';
import { Task, TaskStatus } from '../../types/taskTypes';

const AllTasksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { status = TaskStatus.ToDo } = route.params as { status?: TaskStatus };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [selectedDateValue, setSelectedDateValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  // Generate current week dates dynamically
  const generateCurrentWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    console.log('📅 Generating dates for current week');
    
    // Start from Sunday of current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      const isToday = date.toDateString() === today.toDateString();
      
      dates.push({
        label: date.getDate().toString(),
        day: isToday ? 'Today' : dayName,
        value: date.toISOString().split('T')[0],
        date: new Date(date)
      });
    }
    
    console.log('📅 Generated dates:', dates.map(d => ({ day: d.day, value: d.value })));
    return dates;
  };

  const [dateOptions, setDateOptions] = useState(generateCurrentWeekDates());

  // Set initial selected date to today
  useEffect(() => {
    const todayOption = dateOptions.find(date => date.day === 'Today');
    if (todayOption) {
      console.log('🎯 Setting initial date to today:', todayOption.value);
      setSelectedDateValue(todayOption.value);
      setSelectedDate('Today');
    }
  }, [dateOptions]);

  const counts = {
    toDoCount: tasks.filter(task => task.taskStatus === TaskStatus.ToDo).length,
    pendingCount: tasks.filter(task => task.taskStatus === TaskStatus.Pending).length,
    doneCount: tasks.filter(task => task.taskStatus === TaskStatus.Done).length,
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await taskAPI.getUserTasks();

      console.log('📦 Tasks data received:', tasksData?.length || 0, 'tasks');
      if (tasksData && tasksData.length > 0) {
        console.log('📆 Sample task date ranges:', tasksData.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          startDate: t.startDate,
          endDate: t.endDate,
          startFormatted: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : 'No date',
          endFormatted: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : 'No date'
        })));
      }

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

  // Refresh tasks
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  // Check if a task should be displayed on a specific date
  const isTaskActiveOnDate = (task: Task, targetDateStr: string): boolean => {
    if (!task.startDate) {
      return false;
    }

    try {
      const targetDate = new Date(targetDateStr);
      const startDate = new Date(task.startDate);
      const endDate = task.endDate ? new Date(task.endDate) : null;

      // Normalize dates to compare only dates (ignore time)
      const targetDateNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      let endDateNormalized = null;
      if (endDate) {
        endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      }

      console.log(`📅 Date check for task ${task.id}:`, {
        target: targetDateNormalized.toISOString().split('T')[0],
        start: startDateNormalized.toISOString().split('T')[0],
        end: endDateNormalized ? endDateNormalized.toISOString().split('T')[0] : 'No end date',
        targetTime: targetDateNormalized.getTime(),
        startTime: startDateNormalized.getTime(),
        endTime: endDateNormalized ? endDateNormalized.getTime() : 'No end'
      });

      // If no end date, only show on start date
      if (!endDateNormalized) {
        const matches = targetDateNormalized.getTime() === startDateNormalized.getTime();
        console.log(`📅 No end date - showing only on start date: ${matches}`);
        return matches;
      }

      // Show task on all dates from startDate to endDate-1 (exclusive of endDate)
      const isActive = 
        targetDateNormalized.getTime() >= startDateNormalized.getTime() && 
        targetDateNormalized.getTime() < endDateNormalized.getTime();

      console.log(`📅 Task ${task.id} active on ${targetDateStr}: ${isActive} (from ${startDateNormalized.toISOString().split('T')[0]} to ${endDateNormalized.toISOString().split('T')[0]})`);
      
      return isActive;

    } catch (error) {
      console.log(`❌ Task ${task.id}: Invalid date format`, error);
      return false;
    }
  };

  // Filter tasks - UPDATED LOGIC
  const filterTasks = useCallback((
    taskList: Task[],
    status: TaskStatus,
    query: string,
    dateValue?: string
  ): void => {
    console.log('🔍 Starting filter with:', {
      totalTasks: taskList.length,
      status,
      query,
      dateValue,
      selectedDate
    });

    let filtered = taskList.filter((task) => {
      const matchesStatus = task.taskStatus === status;
      return matchesStatus;
    });

    console.log(`📊 After status filter (${status}):`, filtered.length);

    // Filter by date range if a specific date is selected
    if (dateValue && dateValue !== 'all'  && status !== TaskStatus.Done) {
      console.log(`📅 Filtering by date range for: ${dateValue}`);
      filtered = filtered.filter((task) => {
        const isActive = isTaskActiveOnDate(task, dateValue);
        console.log(`📆 Task ${task.id} active on ${dateValue}: ${isActive}`);
     return isActive;
    });
    console.log(`✅ After date range filter (${dateValue}):`, filtered.length);
  } else if (status === TaskStatus.Done) {
    console.log('✅ Done tab - skipping date filtering, showing all completed tasks');
  } else {
    console.log('📅 No date filter applied');
  }

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(query.toLowerCase()) ||
          task.description?.toLowerCase().includes(query.toLowerCase())
      );
      console.log(`🔎 After search filter (${query}):`, filtered.length);
    }

    console.log('🎯 Final filtered tasks count:', filtered.length);
    console.log('🎯 Final filtered tasks:', filtered.map(t => ({ 
      id: t.id, 
      title: t.title, 
      startDate: t.startDate,
      endDate: t.endDate,
      startFormatted: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : 'No date',
      endFormatted: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : 'No date'
    })));
    setFilteredTasks(filtered);
  }, [selectedDate]);

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Handle date change from date cards
  const handleDateChange = (dateValue: string, dateLabel: string) => {
    console.log('📅 Date changed:', { dateValue, dateLabel });
    setSelectedDate(dateLabel);
    setSelectedDateValue(dateValue);
    // Apply filtering immediately
    filterTasks(tasks, status, searchQuery, dateValue);
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (day: any) => {
    const selectedDateStr = day.dateString;
    console.log('📅 Calendar date selected:', selectedDateStr);
    
    // Check if this date is in our current week
    const existingDate = dateOptions.find(date => date.value === selectedDateStr);
    
    if (existingDate) {
      setSelectedDate(existingDate.day);
    } else {
      // If not in current week, add it as a custom date
      const customDate = {
        label: new Date(selectedDateStr).getDate().toString(),
        day: 'Custom',
        value: selectedDateStr,
        date: new Date(selectedDateStr)
      };
      setDateOptions(prev => [...prev, customDate]);
      setSelectedDate('Custom');
    }
    
    setSelectedDateValue(selectedDateStr);
    setShowCalendarModal(false);
    // Apply filtering immediately with the new date
    filterTasks(tasks, status, searchQuery, selectedDateStr);
  };

  // Handle complete task with optimistic updates
  const handleCompleteTask = async (taskId: number) => {
    try {
      setCompletingTaskId(taskId);

      console.log('🔄 Starting complete task process for ID:', taskId);

      // Optimistic update - update UI immediately
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task =>
          task.id === taskId
            ? { ...task, taskStatus: TaskStatus.Done }
            : task
        );
        return updatedTasks;
      });

      // API call
      await taskAPI.markTaskAsComplete(taskId);
      console.log('✅ Task completed successfully on server');

      // Refresh to ensure sync
      await fetchTasks();

    } catch (error: any) {
      console.error('❌ Complete task error:', error);
      
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

  // Handle delete task with optimistic updates
  const handleDeleteTask = async (taskId: number) => {
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

  // Load tasks when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [status])
  );

  // Update filtered tasks when tasks, status, searchQuery, or selectedDateValue changes
  useEffect(() => {
    if (tasks.length > 0 && selectedDateValue) {
      console.log('🔄 Auto-filtering tasks with current selection');
      filterTasks(tasks, status, searchQuery, selectedDateValue);
    } else if (tasks.length > 0) {
      // If no date selected but we have tasks, show all tasks for the status
      console.log('🔄 Filtering tasks without date filter');
      filterTasks(tasks, status, searchQuery);
    }
  }, [tasks, status, searchQuery, selectedDateValue, filterTasks]);

  // Get status display name safely
  const getStatusDisplayName = () => {
    switch (status) {
      case TaskStatus.ToDo:
        return 'to do';
      case TaskStatus.Pending:
        return 'pending';
      case TaskStatus.Done:
        return 'done';
      default:
        return 'to do';
    }
  };

  // Get empty text safely
  const getEmptyText = () => {
    if (searchQuery) {
      return 'No tasks match your search';
    }
    if (selectedDateValue) {
      const selectedDateObj = dateOptions.find(date => date.value === selectedDateValue);
      const dateDisplay = selectedDateObj ? selectedDateObj.day : selectedDate;
      return `No ${getStatusDisplayName()} tasks for ${dateDisplay}`;
    }
    return `No ${getStatusDisplayName()} tasks available`;
  };

  // Swipeable Task Component (same as MyTasksScreen)
  const SwipeableTaskCard = React.memo(({ item }: { item: Task }) => {
    const translateX = new Animated.Value(0);
    const [showComplete, setShowComplete] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const isCompleted = item.taskStatus === TaskStatus.Done;
    const isInDoneTab = status === TaskStatus.Done;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !isCompleted,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isInDoneTab && isCompleted) {
          return gestureState.dx < -10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
        }
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isInDoneTab && isCompleted) {
          if (gestureState.dx < 0) {
            setShowComplete(false);
            setShowDelete(true);
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        } else {
          if (gestureState.dx > 0) {
            setShowComplete(true);
            setShowDelete(false);
            translateX.setValue(Math.min(gestureState.dx, 80));
          } else if (gestureState.dx < 0) {
            setShowComplete(false);
            setShowDelete(true);
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50 && !isInDoneTab) {
          Animated.timing(translateX, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx < -50) {
          Animated.timing(translateX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
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

    const formatDate = (dateString: string) => {
      if (!dateString) return 'No date';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } catch (error) {
        return 'Invalid date';
      }
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
                    source={require('../../assets/icons/checkmark.png')}
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
                  source={require('../../assets/icons/trash.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.actionButtonText}>Delete</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Task Card */}
        <Animated.View
          style={[
            styles.taskCard,
            isCompleted && styles.completedTaskCard,
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
              navigation.navigate('TaskDetail', { taskId: item.id });
            }}
            activeOpacity={0.9}
            disabled={isCompleting}
          >
            <View style={styles.taskContent}>
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle,
                  isCompleted && styles.completedTaskTitle
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <View style={styles.headerSpacer} />
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
          style={styles.searchIcon}
          resizeMode="contain"
        />
      </View>

      {/* Date selector - Horizontal scroll */}
      <View style={styles.dateScrollContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dateOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item: date }) => (
            <TouchableOpacity
              style={[
                styles.dateCard,
                selectedDateValue === date.value && styles.dateCardSelected,
              ]}
              onPress={() => handleDateChange(date.value, date.day)}
            >
              <Text style={[
                styles.dateNumber,
                selectedDateValue === date.value && styles.dateNumberSelected,
              ]}>
                {date.label}
              </Text>
              <Text style={[
                styles.dateDay,
                selectedDateValue === date.value && styles.dateDaySelected,
              ]}>
                {date.day}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.dateScrollContent}
        />
        
      </View>
      <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setShowCalendarModal(true)}
        >
          <Image
            source={require('../../assets/icons/calendar.png')}
            style={styles.calendarIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

      {/* Status filters */}
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[
            styles.statusCard,
            status === TaskStatus.ToDo && styles.statusCardActive,
          ]}
          onPress={() => navigation.setParams({ status: TaskStatus.ToDo })}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/red-document.png')}
              style={styles.statusIcon}
              resizeMode="contain"
            />
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{counts.toDoCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>To Do</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusCard,
            status === TaskStatus.Pending && styles.statusCardActive,
          ]}
          onPress={() => navigation.setParams({ status: TaskStatus.Pending })}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/yellow-pending.png')}
              style={styles.statusIcon}
              resizeMode="contain"
            />
            <View style={styles.statusBadgeP}>
              <Text style={styles.statusBadgeText}>{counts.pendingCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusCard,
            status === TaskStatus.Done && styles.statusCardActive,
          ]}
          onPress={() => navigation.setParams({ status: TaskStatus.Done })}
        >
          <View style={styles.statusIconContainer}>
            <Image
              source={require('../../assets/icons/green-done.png')}
              style={styles.statusIcon}
              resizeMode="contain"
            />
            <View style={styles.statusBadgeD}>
              <Text style={styles.statusBadgeText}>{counts.doneCount}</Text>
            </View>
          </View>
          <Text style={styles.statusLabel}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found</Text>
          <Text style={styles.emptySubText}>
            {getEmptyText()}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchTasks}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => <SwipeableTaskCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add task button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Image
          source={require('../../assets/icons/tasks.png')}
          style={styles.addIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <Text style={styles.calendarModalTitle}>Select Date</Text>
            <Calendar
              onDayPress={handleCalendarDateSelect}
              markedDates={{
                [selectedDateValue]: {
                  selected: true,
                  selectedColor: '#7C3AED',
                  selectedTextColor: '#FFFFFF',
                },
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#7C3AED',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#7C3AED',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#7C3AED',
                monthTextColor: '#1E293B',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
            />
            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
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
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
    marginLeft: 8,
  },
  dateScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateScrollContent: {
    paddingRight: 4,
  },
  dateCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  dateCardSelected: {
    backgroundColor: '#7C3AED',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  dateNumberSelected: {
    color: '#fff',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dateDaySelected: {
    color: '#fff',
  },
  calendarButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    // padding: 8,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center", 
    alignSelf: "flex-end",
    marginBottom: 10
  },
  calendarIcon: {
    width: 30,
    height: 30,
    tintColor: '#7C3AED',
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
    width: 32,
    height: 32,
  },
  statusBadge: {
    position: 'absolute',
    top: -8,
    right: -18,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeP: {
    position: 'absolute',
    top: -8,
    right: -18,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeD: {
    position: 'absolute',
    top: -8,
    right: -18,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  swipeableContainer: {
    position: 'relative',
    marginBottom: 12,
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
    width: 80,
    justifyContent: 'center',
    borderRadius: 12,
  },
  completeAction: {
    backgroundColor: '#7C3AED',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    marginLeft: 'auto',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  completeContent: {
    alignItems: 'center',
  },
  deleteContent: {
    alignItems: 'center',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginBottom: 4,
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
  priorityFlag: {
    width: 16,
    height: 16,
    marginLeft: 8,
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
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
  dateSeparator: {
    fontSize: 12,
    color: '#F59E0B',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  addIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarCloseButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  calendarCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Debug styles
  debugContainer: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'monospace',
  },
   completedTaskCard: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  completedTaskTitle: {
    color: '#065F46',
    textDecorationLine: 'line-through',
  },
  completedTaskDescription: {
    color: '#047857',
    textDecorationLine: 'line-through',
  },
  completedDateText: {
    color: '#059669',
  },
  completedDateSeparator: {
    color: '#10B981',
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
});

export default AllTasksScreen;
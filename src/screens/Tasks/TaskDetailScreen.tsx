// src/screens/TaskDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { taskAPI } from '../../api/taskAPI';
import { TaskStatus, UpdateTaskRequest, Task } from '../../types/taskTypes';

const TaskDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: number };

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [priority, setPriority] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [completed, setCompleted] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch task details
  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const taskData = await taskAPI.getTaskById(taskId);
      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description);
      setStartDate(new Date(taskData.startDate));
      setEndDate(new Date(taskData.endDate));
      setPriority(taskData.priority);
      setTaskStatus(taskData.taskStatus);
      setCompleted(taskData.completed);
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Format date for calendar
  const formatDateForCalendar = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Handle start date selection
  const handleStartDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setStartDate(selectedDate);
    setShowStartDateCalendar(false);
    
    // If end date is before new start date, update end date too
    if (endDate < selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Handle end date selection
  const handleEndDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setEndDate(selectedDate);
    setShowEndDateCalendar(false);
  };

  // Get marked dates for calendar
  const getMarkedDates = (selectedDate: Date, type: 'start' | 'end') => {
    const formattedDate = formatDateForCalendar(selectedDate);
    return {
      [formattedDate]: {
        selected: true,
        selectedColor: type === 'start' ? '#EF4444' : '#10B981',
        selectedTextColor: '#FFFFFF',
      },
    };
  };

  // Status selection handler
  const handleStatusSelect = (status: TaskStatus) => {
    setTaskStatus(status);
    setShowStatusModal(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a task title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a task description');
      return false;
    }
    if (endDate < startDate) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }
    return true;
  };

  // Handle update
  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setUpdating(true);

      const updateData: UpdateTaskRequest = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        taskStatus,
        priority,
        completed,
      };

      await taskAPI.updateTask(taskId, updateData);

      Alert.alert('Success', 'Task updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating task:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update task'
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
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
              await taskAPI.deleteTask(taskId);
              Alert.alert('Success', 'Task deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.ToDo:
        return 'To-Do';
      case TaskStatus.Pending:
        return 'Pending';
      case TaskStatus.Done:
        return 'Done';
      default:
        return 'To-Do';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.ToDo:
        return '#EF4444';
      case TaskStatus.Pending:
        return '#F59E0B';
      case TaskStatus.Done:
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading task details...</Text>
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
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Task</Text>
        {/* <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Image
            source={require('../../assets/icons/delete.png')}
            style={styles.deleteButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity> */}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Title Input */}
        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description Input */}
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Description"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Start Date */}
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowStartDateCalendar(true)}
        >
          <Text style={styles.dateText}>
            Start: {startDate.toLocaleDateString()}
          </Text>
          <Image
            source={require('../../assets/icons/calendar.png')}
            style={styles.calendarIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* End Date */}
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowEndDateCalendar(true)}
        >
          <Text style={styles.dateText}>
            End: {endDate.toLocaleDateString()}
          </Text>
          <Image
            source={require('../../assets/icons/calendar.png')}
            style={styles.calendarIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Priority Toggle */}
        <TouchableOpacity
          style={styles.priorityContainer}
          onPress={() => setPriority(!priority)}
        >
          <Text style={styles.priorityLabel}>Priority</Text>
          <View style={styles.priorityToggle}>
            <Text style={styles.flagIcon}>
              {priority ? '🚩' : '🏳️'}
            </Text>
            <Text style={styles.priorityText}>
              {/* {priority ? 'High' : 'Normal'} */}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Completed Toggle */}
        {/* <TouchableOpacity
          style={styles.priorityContainer}
          onPress={() => setCompleted(!completed)}
        >
          <Text style={styles.priorityLabel}>Completed</Text>
          <View style={styles.priorityToggle}>
            <Text style={styles.flagIcon}>
              {completed ? '✅' : '⭕'}
            </Text>
            <Text style={styles.priorityText}>
              {completed ? 'Yes' : 'No'}
            </Text>
          </View>
        </TouchableOpacity> */}

        {/* Task Status Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={styles.statusDisplay}>
              {/* <View 
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(taskStatus) }
                ]} 
              /> */}
              <Text style={styles.dropdownText}>
                {getStatusText(taskStatus)}
              </Text>
            </View>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Update Task Button */}
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={updating}
        >
          <Text style={styles.updateButtonText}>
            {updating ? 'Updating Task...' : 'Update Task'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start Date Calendar Modal */}
      <Modal
        visible={showStartDateCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartDateCalendar(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <Text style={styles.calendarModalTitle}>Select Start Date</Text>
            <Calendar
              onDayPress={handleStartDateSelect}
              markedDates={getMarkedDates(startDate, 'start')}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#EF4444',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#EF4444',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#EF4444',
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
              onPress={() => setShowStartDateCalendar(false)}
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Date Calendar Modal */}
      <Modal
        visible={showEndDateCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndDateCalendar(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            <Text style={styles.calendarModalTitle}>Select End Date</Text>
            <Calendar
              onDayPress={handleEndDateSelect}
              markedDates={getMarkedDates(endDate, 'end')}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#10B981',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#10B981',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#10B981',
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
              onPress={() => setShowEndDateCalendar(false)}
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Status</Text>
                
                {/* To-Do Option */}
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    taskStatus === TaskStatus.ToDo && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusSelect(TaskStatus.ToDo)}
                >
                  {/* <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} /> */}
                  <Text style={styles.statusOptionText}>To-Do</Text>
                  {taskStatus === TaskStatus.ToDo && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* Pending Option */}
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    taskStatus === TaskStatus.Pending && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusSelect(TaskStatus.Pending)}
                >
                  {/* <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} /> */}
                  <Text style={styles.statusOptionText}>Pending</Text>
                  {taskStatus === TaskStatus.Pending && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* Done Option */}
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    taskStatus === TaskStatus.Done && styles.statusOptionSelected
                  ]}
                  onPress={() => handleStatusSelect(TaskStatus.Done)}
                >
                  {/* <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} /> */}
                  <Text style={styles.statusOptionText}>Done</Text>
                  {taskStatus === TaskStatus.Done && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#FF4500',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 20
  },
  backButton: {
    padding: 4,

  },
  backButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginRight: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    alignSelf: "center",
    marginLeft: 60
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  descriptionInput: {
    height: 150,
    paddingTop: 14,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  calendarIconImage: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  priorityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagIcon: {
    fontSize: 20,
  },
  priorityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  updateButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  // Status Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusOptionSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#7C3AED',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  checkIcon: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskDetailScreen;
// ============================================
// NOTIFICATION SERVICE
// Push notifications for reminders & habits
// ============================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==========================================
// TYPES
// ==========================================

export interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  triggerTime: Date;
  type: 'task' | 'habit' | 'custom';
  relatedId?: string; // task or habit ID
  recurring?: {
    frequency: 'daily' | 'weekly' | 'weekdays';
    time: string; // HH:MM format
  };
}

// ==========================================
// PERMISSION HANDLING
// ==========================================

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  // iOS specific setup
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  return true;
}

// ==========================================
// SCHEDULING NOTIFICATIONS
// ==========================================

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date,
  minutesBefore: number = 30
): Promise<string | null> {
  try {
    const triggerDate = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);

    if (triggerDate <= new Date()) {
      console.log('Trigger time is in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Task Reminder',
        body: `"${title}" is due in ${minutesBefore} minutes`,
        data: { type: 'task', taskId },
        sound: true,
      },
      trigger: {
        date: triggerDate,
      },
    });

    await saveScheduledReminder({
      id: notificationId,
      title: 'Task Reminder',
      body: title,
      triggerTime: triggerDate,
      type: 'task',
      relatedId: taskId,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling task reminder:', error);
    return null;
  }
}

export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  time: string, // HH:MM format
  frequency: 'daily' | 'weekdays' = 'daily'
): Promise<string | null> {
  try {
    const [hours, minutes] = time.split(':').map(Number);

    let trigger: Notifications.NotificationTriggerInput;

    if (frequency === 'daily') {
      trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };
    } else {
      // Weekdays - schedule for Monday through Friday
      // We'll need to create multiple notifications
      trigger = {
        hour: hours,
        minute: minutes,
        weekday: 2, // Monday (1=Sunday, 2=Monday, etc.)
        repeats: true,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Habit Time!',
        body: `Time for: ${habitName}`,
        data: { type: 'habit', habitId },
        sound: true,
      },
      trigger,
    });

    await saveScheduledReminder({
      id: notificationId,
      title: 'Habit Reminder',
      body: habitName,
      triggerTime: new Date(),
      type: 'habit',
      relatedId: habitId,
      recurring: { frequency, time },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling habit reminder:', error);
    return null;
  }
}

export async function scheduleMorningBriefing(time: string = '08:00'): Promise<string | null> {
  try {
    const [hours, minutes] = time.split(':').map(Number);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Good Morning!',
        body: 'Check your Big 3 tasks for today',
        data: { type: 'briefing' },
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling morning briefing:', error);
    return null;
  }
}

export async function scheduleEveningReview(time: string = '20:00'): Promise<string | null> {
  try {
    const [hours, minutes] = time.split(':').map(Number);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Evening Review',
        body: 'How did today go? Log your progress!',
        data: { type: 'review' },
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling evening review:', error);
    return null;
  }
}

// ==========================================
// QUICK REMINDERS (Pomodoro style)
// ==========================================

export async function scheduleQuickReminder(
  title: string,
  minutesFromNow: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Reminder',
        body: title,
        data: { type: 'quick' },
        sound: true,
      },
      trigger: {
        seconds: minutesFromNow * 60,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling quick reminder:', error);
    return null;
  }
}

// ==========================================
// CANCELLATION
// ==========================================

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await removeScheduledReminder(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem('scheduled_reminders');
}

export async function cancelNotificationsForTask(taskId: string): Promise<void> {
  const reminders = await getScheduledReminders();
  const taskReminders = reminders.filter(r => r.relatedId === taskId);

  for (const reminder of taskReminders) {
    await cancelNotification(reminder.id);
  }
}

export async function cancelNotificationsForHabit(habitId: string): Promise<void> {
  const reminders = await getScheduledReminders();
  const habitReminders = reminders.filter(r => r.relatedId === habitId);

  for (const reminder of habitReminders) {
    await cancelNotification(reminder.id);
  }
}

// ==========================================
// STORAGE HELPERS
// ==========================================

async function saveScheduledReminder(reminder: ScheduledReminder): Promise<void> {
  const reminders = await getScheduledReminders();
  reminders.push(reminder);
  await AsyncStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
}

async function removeScheduledReminder(notificationId: string): Promise<void> {
  const reminders = await getScheduledReminders();
  const filtered = reminders.filter(r => r.id !== notificationId);
  await AsyncStorage.setItem('scheduled_reminders', JSON.stringify(filtered));
}

export async function getScheduledReminders(): Promise<ScheduledReminder[]> {
  const stored = await AsyncStorage.getItem('scheduled_reminders');
  return stored ? JSON.parse(stored) : [];
}

// ==========================================
// NOTIFICATION LISTENERS
// ==========================================

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ==========================================
// GET PENDING NOTIFICATIONS
// ==========================================

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

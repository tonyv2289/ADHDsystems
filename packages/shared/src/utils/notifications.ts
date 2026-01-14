// ============================================
// NOTIFICATION UTILITIES
// Smart, ADHD-friendly notifications
// ============================================

import {
  Notification,
  NotificationType,
  Task,
  TimeBlock,
  Streak,
  Quest,
  Achievement,
} from '../types';
import { v4 as uuid } from 'uuid';
import { differenceInMinutes } from 'date-fns';

// ==========================================
// NOTIFICATION CREATION
// ==========================================

export function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  scheduledFor: Date = new Date(),
  data?: Record<string, unknown>
): Notification {
  return {
    id: uuid(),
    userId,
    type,
    title,
    body,
    data,
    scheduledFor,
  };
}

// ==========================================
// SMART NOTIFICATION GENERATION
// ==========================================

/**
 * Task reminder - context aware and not nagging
 */
export function createTaskReminder(
  userId: string,
  task: Task,
  reminderTime: Date
): Notification {
  const urgencyPrefix = task.priority === 'critical'
    ? '🚨 '
    : task.priority === 'high'
      ? '⚡ '
      : '';

  const body = task.estimatedMinutes <= 5
    ? `Quick 5-minute task ready to go!`
    : `${task.estimatedMinutes} minutes estimated`;

  return createNotification(
    userId,
    'task_reminder',
    `${urgencyPrefix}${task.title}`,
    body,
    reminderTime,
    { taskId: task.id }
  );
}

/**
 * Time anchor notification
 */
export function createTimeAnchorNotification(
  userId: string,
  nextEvent: TimeBlock,
  minutesUntil: number
): Notification {
  let title: string;
  let body: string;

  if (minutesUntil <= 5) {
    title = `⏰ ${nextEvent.title} starts NOW`;
    body = 'Time to transition!';
  } else if (minutesUntil <= 15) {
    title = `🕐 ${minutesUntil} minutes until ${nextEvent.title}`;
    body = 'Start wrapping up what you\'re doing';
  } else if (minutesUntil <= 30) {
    title = `📅 ${nextEvent.title} in ${minutesUntil} min`;
    body = 'Heads up on your upcoming event';
  } else {
    title = `${nextEvent.title} coming up`;
    body = `In about ${Math.round(minutesUntil / 60)} hours`;
  }

  return createNotification(
    userId,
    'time_anchor',
    title,
    body,
    new Date(),
    { eventId: nextEvent.id, minutesUntil }
  );
}

/**
 * Streak warning - gentle, not nagging
 */
export function createStreakWarning(
  userId: string,
  streak: Streak,
  hoursLeft: number
): Notification {
  let title: string;
  let body: string;

  if (hoursLeft <= 2) {
    title = `🔥 ${streak.currentCount}-day streak ending soon!`;
    body = 'Just one small task to keep it alive';
  } else if (hoursLeft <= 6) {
    title = `Your ${streak.currentCount}-day streak needs you`;
    body = 'Complete a task before the day ends';
  } else {
    title = `Keep the momentum: Day ${streak.currentCount + 1}`;
    body = 'One task = streak extended';
  }

  return createNotification(
    userId,
    'streak_warning',
    title,
    body,
    new Date(),
    { streakId: streak.id, currentCount: streak.currentCount }
  );
}

/**
 * Achievement unlocked notification
 */
export function createAchievementNotification(
  userId: string,
  achievement: Achievement
): Notification {
  const rarityEmoji = {
    common: '✨',
    uncommon: '🌟',
    rare: '💫',
    epic: '🏆',
    legendary: '👑',
  };

  return createNotification(
    userId,
    'achievement_unlocked',
    `${rarityEmoji[achievement.rarity]} Achievement Unlocked!`,
    `${achievement.icon} ${achievement.name}: ${achievement.description}`,
    new Date(),
    { achievementId: achievement.id, xpReward: achievement.xpReward }
  );
}

/**
 * Quest progress notification
 */
export function createQuestProgressNotification(
  userId: string,
  quest: Quest,
  justCompleted: boolean
): Notification {
  if (justCompleted) {
    return createNotification(
      userId,
      'quest_progress',
      '🎮 Daily Quest Complete!',
      `${quest.title} done! +${quest.xpReward} XP`,
      new Date(),
      { questId: quest.id }
    );
  }

  const progress = Math.round((quest.current / quest.target) * 100);
  return createNotification(
    userId,
    'quest_progress',
    `📊 Quest Progress: ${progress}%`,
    `${quest.title}: ${quest.current}/${quest.target}`,
    new Date(),
    { questId: quest.id }
  );
}

/**
 * Recovery check-in - gentle welcome back
 */
export function createRecoveryCheckIn(
  userId: string,
  daysMissed: number
): Notification {
  const messages = [
    { title: 'Hey, welcome back! 👋', body: 'Ready to build some momentum?' },
    { title: 'Good to see you! 🌟', body: 'One small step is all it takes.' },
    { title: 'You\'re here! 💪', body: 'That\'s already a win. What\'s next?' },
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  return createNotification(
    userId,
    'recovery_check_in',
    message.title,
    message.body,
    new Date(),
    { daysMissed }
  );
}

/**
 * Daily summary notification
 */
export function createDailySummary(
  userId: string,
  tasksCompleted: number,
  xpEarned: number,
  streakCount: number
): Notification {
  let emoji = '📊';
  let title = 'Daily Wrap-Up';

  if (tasksCompleted >= 5) {
    emoji = '🌟';
    title = 'Amazing Day!';
  } else if (tasksCompleted >= 3) {
    emoji = '💪';
    title = 'Solid Day!';
  } else if (tasksCompleted >= 1) {
    emoji = '✓';
    title = 'Day Complete';
  } else {
    emoji = '🌅';
    title = 'Day Summary';
  }

  const streakText = streakCount > 0 ? ` | ${streakCount}🔥` : '';
  const body = `${tasksCompleted} tasks | +${xpEarned} XP${streakText}`;

  return createNotification(
    userId,
    'daily_summary',
    `${emoji} ${title}`,
    body,
    new Date(),
    { tasksCompleted, xpEarned, streakCount }
  );
}

// ==========================================
// NOTIFICATION SCHEDULING
// ==========================================

export interface NotificationSchedule {
  userId: string;
  notifications: Notification[];
}

/**
 * Schedule smart notifications for the day
 * Respects quiet hours and doesn't nag
 */
export function scheduleDayNotifications(
  userId: string,
  tasks: Task[],
  events: TimeBlock[],
  streak: Streak | null,
  quietHoursStart: string,
  quietHoursEnd: string
): NotificationSchedule {
  const notifications: Notification[] = [];
  const now = new Date();

  // Parse quiet hours
  const [quietStartHour] = quietHoursStart.split(':').map(Number);
  const [quietEndHour] = quietHoursEnd.split(':').map(Number);

  const isInQuietHours = (date: Date): boolean => {
    const hour = date.getHours();
    if (quietStartHour > quietEndHour) {
      // Overnight quiet hours (e.g., 22:00 - 07:00)
      return hour >= quietStartHour || hour < quietEndHour;
    }
    return hour >= quietStartHour && hour < quietEndHour;
  };

  // Schedule time anchor notifications for upcoming events
  events
    .filter(e => e.startTime > now)
    .forEach(event => {
      const minutesUntil = differenceInMinutes(event.startTime, now);

      // 30-minute warning
      if (minutesUntil > 30 && minutesUntil <= 60) {
        const notifTime = new Date(event.startTime);
        notifTime.setMinutes(notifTime.getMinutes() - 30);

        if (!isInQuietHours(notifTime)) {
          notifications.push(createTimeAnchorNotification(userId, event, 30));
        }
      }

      // 15-minute warning
      if (minutesUntil > 15) {
        const notifTime = new Date(event.startTime);
        notifTime.setMinutes(notifTime.getMinutes() - 15);

        if (!isInQuietHours(notifTime)) {
          notifications.push(createTimeAnchorNotification(userId, event, 15));
        }
      }
    });

  // Schedule streak warning if streak is at risk
  if (streak && streak.currentCount > 0) {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const hoursLeft = differenceInMinutes(endOfDay, now) / 60;

    if (hoursLeft <= 6 && hoursLeft > 2) {
      notifications.push(createStreakWarning(userId, streak, hoursLeft));
    }
  }

  return { userId, notifications };
}

// ==========================================
// NOTIFICATION PREFERENCES
// ==========================================

export interface NotificationPreferences {
  enabled: boolean;
  types: {
    taskReminders: boolean;
    timeAnchors: boolean;
    streakWarnings: boolean;
    achievements: boolean;
    questProgress: boolean;
    dailySummary: boolean;
    partnerNudges: boolean;
    recoveryCheckIns: boolean;
  };
  frequency: 'minimal' | 'balanced' | 'all';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  types: {
    taskReminders: true,
    timeAnchors: true,
    streakWarnings: true,
    achievements: true,
    questProgress: false, // Can be noisy
    dailySummary: true,
    partnerNudges: true,
    recoveryCheckIns: true,
  },
  frequency: 'balanced',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
};

/**
 * Filter notifications based on preferences
 */
export function filterByPreferences(
  notifications: Notification[],
  preferences: NotificationPreferences
): Notification[] {
  if (!preferences.enabled) return [];

  return notifications.filter(notification => {
    // Check type preference
    const typeMap: Record<NotificationType, keyof NotificationPreferences['types']> = {
      task_reminder: 'taskReminders',
      chain_trigger: 'taskReminders',
      time_anchor: 'timeAnchors',
      streak_warning: 'streakWarnings',
      achievement_unlocked: 'achievements',
      quest_progress: 'questProgress',
      partner_nudge: 'partnerNudges',
      recovery_check_in: 'recoveryCheckIns',
      daily_summary: 'dailySummary',
    };

    const prefKey = typeMap[notification.type];
    if (prefKey && !preferences.types[prefKey]) {
      return false;
    }

    // Check frequency
    if (preferences.frequency === 'minimal') {
      // Only allow high-priority notifications
      const minimalTypes: NotificationType[] = [
        'streak_warning',
        'achievement_unlocked',
        'daily_summary',
      ];
      if (!minimalTypes.includes(notification.type)) {
        return false;
      }
    }

    return true;
  });
}

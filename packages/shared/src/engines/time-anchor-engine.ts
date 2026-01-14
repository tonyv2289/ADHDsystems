// ============================================
// TIME ANCHOR ENGINE
// Defeating time blindness for ADHD brains
// Making future consequences feel immediate
// ============================================

import { v4 as uuid } from 'uuid';
import {
  TimeBlock,
  TimeDebt,
  TimeAwareness,
  Task,
  UserSettings,
  DEFAULTS,
} from '../types';
import { differenceInMinutes, addMinutes, format, isToday, isTomorrow, startOfDay, endOfDay } from 'date-fns';

// ==========================================
// TIME AWARENESS
// ==========================================

/**
 * Get the current time awareness state
 * This should be constantly visible to the user
 */
export function calculateTimeAwareness(
  userId: string,
  timeBlocks: TimeBlock[],
  settings: UserSettings
): TimeAwareness {
  const now = new Date();

  // Find current and next events
  const todayBlocks = timeBlocks
    .filter(b => isToday(b.startTime))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const currentActivity = todayBlocks.find(
    b => b.startTime <= now && b.endTime > now
  );

  const upcomingBlocks = todayBlocks.filter(b => b.startTime > now);
  const nextEvent = upcomingBlocks[0];

  const minutesUntilNextEvent = nextEvent
    ? differenceInMinutes(nextEvent.startTime, now)
    : undefined;

  // Calculate day progress
  const wakeTime = parseTimeString(settings.wakeTime);
  const sleepTime = parseTimeString(settings.sleepTime);

  const dayStart = new Date(now);
  dayStart.setHours(wakeTime.hours, wakeTime.minutes, 0, 0);

  const dayEnd = new Date(now);
  dayEnd.setHours(sleepTime.hours, sleepTime.minutes, 0, 0);

  const totalDayMinutes = differenceInMinutes(dayEnd, dayStart);
  const elapsedMinutes = Math.max(0, differenceInMinutes(now, dayStart));
  const remainingMinutes = Math.max(0, differenceInMinutes(dayEnd, now));

  const dayProgress = Math.min(100, Math.round((elapsedMinutes / totalDayMinutes) * 100));

  return {
    userId,
    currentTime: now,
    nextEvent,
    minutesUntilNextEvent,
    currentActivity,
    todayRemaining: remainingMinutes,
    todayUsed: elapsedMinutes,
    dayProgress,
  };
}

function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

// ==========================================
// TIME BLOCKS
// ==========================================

export interface CreateTimeBlockInput {
  title: string;
  startTime: Date;
  endTime: Date;
  type: TimeBlock['type'];
  taskId?: string;
  isFlexible?: boolean;
}

export function createTimeBlock(
  userId: string,
  input: CreateTimeBlockInput,
  settings: UserSettings
): TimeBlock {
  // Auto-add transition time before events
  const transitionMinutes = input.type === 'event'
    ? settings.transitionTimePadding
    : 0;

  return {
    id: uuid(),
    userId,
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    type: input.type,
    taskId: input.taskId,
    isFlexible: input.isFlexible ?? (input.type !== 'event'),
    transitionMinutes,
  };
}

/**
 * Create a focus block for deep work
 */
export function createFocusBlock(
  userId: string,
  durationMinutes: number,
  taskId?: string
): TimeBlock {
  const now = new Date();
  const endTime = addMinutes(now, durationMinutes);

  return {
    id: uuid(),
    userId,
    title: 'Focus Time',
    startTime: now,
    endTime,
    type: 'focus',
    taskId,
    isFlexible: false,
    transitionMinutes: 0,
  };
}

/**
 * Auto-add transition blocks between events
 */
export function addTransitionBlocks(
  timeBlocks: TimeBlock[],
  userId: string,
  settings: UserSettings
): TimeBlock[] {
  const sorted = [...timeBlocks].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const withTransitions: TimeBlock[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    withTransitions.push(current);

    // If there's a next event and it's an external event, add transition
    if (next && next.type === 'event' && next.transitionMinutes > 0) {
      const transitionStart = addMinutes(current.endTime, 0);
      const transitionEnd = addMinutes(transitionStart, next.transitionMinutes);

      // Only add if there's a gap
      if (transitionEnd <= next.startTime) {
        withTransitions.push({
          id: uuid(),
          userId,
          title: `Transition to ${next.title}`,
          startTime: transitionStart,
          endTime: transitionEnd,
          type: 'transition',
          isFlexible: false,
          transitionMinutes: 0,
        });
      }
    }
  }

  return withTransitions;
}

// ==========================================
// TIME DEBT
// ==========================================

/**
 * Track "promises to future self"
 * Making procrastination visible
 */
export function createTimeDebt(
  userId: string,
  description: string,
  promisedDate: Date,
  estimatedMinutes: number,
  importance: TimeDebt['importance'] = 'medium'
): TimeDebt {
  return {
    id: uuid(),
    userId,
    description,
    promisedDate,
    estimatedMinutes,
    importance,
    status: 'pending',
  };
}

export function payTimeDebt(debt: TimeDebt): TimeDebt {
  return {
    ...debt,
    status: 'paid',
  };
}

export function defaultOnTimeDebt(debt: TimeDebt): TimeDebt {
  return {
    ...debt,
    status: 'defaulted',
  };
}

/**
 * Get total time debt
 */
export function calculateTotalTimeDebt(debts: TimeDebt[]): {
  totalMinutes: number;
  overdueMinutes: number;
  upcomingMinutes: number;
  debtCount: number;
} {
  const pending = debts.filter(d => d.status === 'pending');
  const now = new Date();

  const overdue = pending.filter(d => d.promisedDate < now);
  const upcoming = pending.filter(d => d.promisedDate >= now);

  return {
    totalMinutes: pending.reduce((sum, d) => sum + d.estimatedMinutes, 0),
    overdueMinutes: overdue.reduce((sum, d) => sum + d.estimatedMinutes, 0),
    upcomingMinutes: upcoming.reduce((sum, d) => sum + d.estimatedMinutes, 0),
    debtCount: pending.length,
  };
}

// ==========================================
// URGENCY INJECTION
// ==========================================

/**
 * Make distant deadlines feel closer
 * "You have 3 days" → "You have 72 hours" → "You have 4,320 minutes"
 */
export function getUrgencyMessage(dueDate: Date): {
  message: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  color: string;
} {
  const now = new Date();
  const minutesUntil = differenceInMinutes(dueDate, now);

  if (minutesUntil < 0) {
    const minutesOverdue = Math.abs(minutesUntil);
    return {
      message: `OVERDUE by ${formatDuration(minutesOverdue)}`,
      urgencyLevel: 'critical',
      color: '#FF0000',
    };
  }

  if (minutesUntil <= 60) {
    return {
      message: `${minutesUntil} minutes left!`,
      urgencyLevel: 'critical',
      color: '#FF0000',
    };
  }

  if (minutesUntil <= 180) {
    return {
      message: `${Math.round(minutesUntil)} minutes until due`,
      urgencyLevel: 'critical',
      color: '#FF4444',
    };
  }

  if (minutesUntil <= 1440) { // 24 hours
    const hours = Math.round(minutesUntil / 60);
    return {
      message: `${hours} hours left (${minutesUntil.toLocaleString()} minutes)`,
      urgencyLevel: 'high',
      color: '#FF8800',
    };
  }

  if (minutesUntil <= 4320) { // 3 days
    const hours = Math.round(minutesUntil / 60);
    return {
      message: `${hours} hours until deadline`,
      urgencyLevel: 'medium',
      color: '#FFCC00',
    };
  }

  const days = Math.round(minutesUntil / 1440);
  return {
    message: `${days} days remaining`,
    urgencyLevel: 'low',
    color: '#00CC00',
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
  return `${Math.round(minutes / 1440)} days`;
}

// ==========================================
// TIME ELAPSED ALERTS
// ==========================================

export interface TimeElapsedAlert {
  activity: string;
  minutesElapsed: number;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

/**
 * Generate alerts when too much time has passed
 */
export function checkTimeElapsed(
  activityStart: Date,
  activityName: string,
  expectedMinutes: number = 30
): TimeElapsedAlert | null {
  const now = new Date();
  const minutesElapsed = differenceInMinutes(now, activityStart);

  if (minutesElapsed < expectedMinutes) {
    return null;
  }

  if (minutesElapsed < expectedMinutes * 2) {
    return {
      activity: activityName,
      minutesElapsed,
      message: `You've been on ${activityName} for ${minutesElapsed} minutes`,
      severity: 'info',
    };
  }

  if (minutesElapsed < expectedMinutes * 3) {
    return {
      activity: activityName,
      minutesElapsed,
      message: `${minutesElapsed} minutes on ${activityName} - time to switch?`,
      severity: 'warning',
    };
  }

  return {
    activity: activityName,
    minutesElapsed,
    message: `${minutesElapsed} minutes on ${activityName}! This might be a rabbit hole.`,
    severity: 'danger',
  };
}

// ==========================================
// DAY VISUALIZATION
// ==========================================

export interface DayVisualization {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  blocks: VisualBlock[];
  currentPosition: number; // percentage through the day
}

export interface VisualBlock {
  id: string;
  title: string;
  startPercent: number;
  widthPercent: number;
  type: TimeBlock['type'];
  isPast: boolean;
  isCurrent: boolean;
}

export function createDayVisualization(
  timeBlocks: TimeBlock[],
  settings: UserSettings
): DayVisualization {
  const now = new Date();

  const wakeTime = parseTimeString(settings.wakeTime);
  const sleepTime = parseTimeString(settings.sleepTime);

  const dayStart = new Date(now);
  dayStart.setHours(wakeTime.hours, wakeTime.minutes, 0, 0);

  const dayEnd = new Date(now);
  dayEnd.setHours(sleepTime.hours, sleepTime.minutes, 0, 0);

  const totalMinutes = differenceInMinutes(dayEnd, dayStart);
  const usedMinutes = Math.max(0, differenceInMinutes(now, dayStart));
  const currentPosition = Math.min(100, (usedMinutes / totalMinutes) * 100);

  const todayBlocks = timeBlocks.filter(b => isToday(b.startTime));

  const blocks: VisualBlock[] = todayBlocks.map(block => {
    const blockStartMinutes = differenceInMinutes(block.startTime, dayStart);
    const blockDuration = differenceInMinutes(block.endTime, block.startTime);

    return {
      id: block.id,
      title: block.title,
      startPercent: (blockStartMinutes / totalMinutes) * 100,
      widthPercent: (blockDuration / totalMinutes) * 100,
      type: block.type,
      isPast: block.endTime < now,
      isCurrent: block.startTime <= now && block.endTime > now,
    };
  });

  return {
    totalMinutes,
    usedMinutes,
    remainingMinutes: totalMinutes - usedMinutes,
    blocks,
    currentPosition,
  };
}

// ==========================================
// SMART SCHEDULING
// ==========================================

export interface ScheduleSuggestion {
  taskId: string;
  suggestedStart: Date;
  suggestedEnd: Date;
  reason: string;
}

/**
 * Suggest when to schedule tasks based on available time
 */
export function suggestTaskSchedule(
  tasks: Task[],
  timeBlocks: TimeBlock[],
  settings: UserSettings
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = [];
  const now = new Date();

  // Get today's schedule
  const todayBlocks = timeBlocks
    .filter(b => isToday(b.startTime) && b.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Find gaps in the schedule
  const gaps = findScheduleGaps(todayBlocks, now, settings);

  // Sort tasks by priority and due date
  const unscheduledTasks = tasks
    .filter(t => t.status === 'pending' && !t.scheduledFor)
    .sort((a, b) => {
      // Due date first
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Then priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, someday: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // Try to fit tasks into gaps
  for (const task of unscheduledTasks) {
    const gap = gaps.find(g => g.duration >= task.estimatedMinutes);

    if (gap) {
      suggestions.push({
        taskId: task.id,
        suggestedStart: gap.start,
        suggestedEnd: addMinutes(gap.start, task.estimatedMinutes),
        reason: gap.reason,
      });

      // Update the gap
      gap.start = addMinutes(gap.start, task.estimatedMinutes);
      gap.duration -= task.estimatedMinutes;
    }
  }

  return suggestions;
}

interface ScheduleGap {
  start: Date;
  duration: number;
  reason: string;
}

function findScheduleGaps(
  blocks: TimeBlock[],
  now: Date,
  settings: UserSettings
): ScheduleGap[] {
  const gaps: ScheduleGap[] = [];

  const sleepTime = parseTimeString(settings.sleepTime);
  const dayEnd = new Date(now);
  dayEnd.setHours(sleepTime.hours, sleepTime.minutes, 0, 0);

  let lastEnd = now;

  for (const block of blocks) {
    const gapDuration = differenceInMinutes(block.startTime, lastEnd);

    if (gapDuration >= 15) { // Minimum useful gap
      gaps.push({
        start: lastEnd,
        duration: gapDuration,
        reason: `${gapDuration} min gap before ${block.title}`,
      });
    }

    lastEnd = block.endTime;
  }

  // Check for gap after last event until end of day
  const endOfDayGap = differenceInMinutes(dayEnd, lastEnd);
  if (endOfDayGap >= 15) {
    gaps.push({
      start: lastEnd,
      duration: endOfDayGap,
      reason: 'Open time until end of day',
    });
  }

  return gaps;
}

// ==========================================
// RELATIVE TIME DISPLAY
// ==========================================

export function getRelativeTimeDisplay(date: Date): string {
  const now = new Date();
  const minutes = differenceInMinutes(date, now);

  if (minutes < 0) {
    return formatPastTime(Math.abs(minutes));
  }

  if (minutes === 0) return 'now';
  if (minutes === 1) return 'in 1 minute';
  if (minutes < 60) return `in ${minutes} minutes`;
  if (minutes < 120) return 'in about an hour';

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hours`;

  if (isTomorrow(date)) return 'tomorrow';

  const days = Math.round(minutes / 1440);
  return `in ${days} days`;
}

function formatPastTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 120) return 'about an hour ago';

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.round(minutes / 1440);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

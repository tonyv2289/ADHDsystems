// ============================================
// RECOVERY ENGINE
// Shame-free restarts for ADHD brains
// Because falling off the wagon is expected
// ============================================

import { v4 as uuid } from 'uuid';
import {
  DayRating,
  Recovery,
  MinimumViableDay,
  Task,
  UserStats,
  EnergyLevel,
  XP_REWARDS,
} from '../types';
import { differenceInDays, startOfDay, subDays } from 'date-fns';

// ==========================================
// DAY RATING SYSTEM
// ==========================================

export type DayType = 'perfect' | 'good' | 'okay' | 'minimum_viable' | 'zero';

export interface DayEvaluation {
  type: DayType;
  tasksCompleted: number;
  tasksPlanned: number;
  completionRate: number;
  mvdAchieved: boolean;
  message: string;
  xpEarned: number;
}

/**
 * Evaluate how the day went
 * No shame, just data
 */
export function evaluateDay(
  tasks: Task[],
  minimumViableDay: MinimumViableDay | null,
  date: Date = new Date()
): DayEvaluation {
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  // Get tasks for this day
  const dayTasks = tasks.filter(t => {
    const taskDate = t.scheduledFor || t.createdAt;
    return taskDate >= dayStart && taskDate <= dayEnd;
  });

  const completed = dayTasks.filter(t => t.status === 'completed');
  const planned = dayTasks.filter(t => t.status !== 'skipped');

  const tasksCompleted = completed.length;
  const tasksPlanned = planned.length;
  const completionRate = tasksPlanned > 0 ? tasksCompleted / tasksPlanned : 0;

  // Check if minimum viable day was achieved
  const mvdAchieved = minimumViableDay
    ? minimumViableDay.taskIds.some(id =>
        completed.some(t => t.id === id || t.parentTaskId === id)
      )
    : tasksCompleted > 0;

  // Calculate XP earned today
  const xpEarned = completed.reduce((sum, t) => sum + t.baseXP, 0);

  // Determine day type
  let type: DayType;
  let message: string;

  if (completionRate >= 0.9 && tasksPlanned >= 3) {
    type = 'perfect';
    message = 'Perfect day! You crushed it! 🌟';
  } else if (completionRate >= 0.7) {
    type = 'good';
    message = 'Good day! Solid progress. 👍';
  } else if (completionRate >= 0.4 || tasksCompleted >= 2) {
    type = 'okay';
    message = 'Okay day. Some wins count! ✓';
  } else if (mvdAchieved || tasksCompleted >= 1) {
    type = 'minimum_viable';
    message = 'Minimum viable day achieved. Not zero! 💪';
  } else {
    type = 'zero';
    message = 'Zero day. It happens. Tomorrow is new. 🌅';
  }

  return {
    type,
    tasksCompleted,
    tasksPlanned,
    completionRate,
    mvdAchieved,
    message,
    xpEarned,
  };
}

/**
 * Create a day rating record
 */
export function createDayRating(
  userId: string,
  evaluation: DayEvaluation,
  energyLevel: EnergyLevel,
  notes?: string
): DayRating {
  return {
    id: uuid(),
    userId,
    date: new Date(),
    type: evaluation.type,
    energyLevel,
    tasksCompleted: evaluation.tasksCompleted,
    xpEarned: evaluation.xpEarned,
    notes,
  };
}

// ==========================================
// MINIMUM VIABLE DAY (MVD)
// ==========================================

/**
 * Set up what counts as "not a zero day"
 * The bare minimum that still maintains momentum
 */
export function createMinimumViableDay(
  userId: string,
  taskIds: string[],
  description: string = 'Do at least one of these to maintain momentum'
): MinimumViableDay {
  return {
    id: uuid(),
    userId,
    taskIds,
    description,
  };
}

export function suggestMVDTasks(tasks: Task[]): Task[] {
  // Suggest quick, high-impact tasks that can be done even on bad days
  return tasks
    .filter(t =>
      t.status === 'pending' &&
      t.estimatedMinutes <= 10 && // Quick
      t.energyRequired <= 2 // Low energy
    )
    .sort((a, b) => {
      // Prioritize recurring tasks (habits)
      if (a.isRecurring && !b.isRecurring) return -1;
      if (!a.isRecurring && b.isRecurring) return 1;

      // Then by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, someday: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);
}

// ==========================================
// RECOVERY TRACKING
// ==========================================

/**
 * Start a recovery after zero days
 */
export function startRecovery(userId: string, daysMissed: number): Recovery {
  return {
    id: uuid(),
    userId,
    startedAt: new Date(),
    daysMissed,
    successful: false,
  };
}

/**
 * Complete a recovery successfully
 */
export function completeRecovery(recovery: Recovery, taskId: string): Recovery {
  return {
    ...recovery,
    endedAt: new Date(),
    recoveryTaskId: taskId,
    successful: true,
  };
}

/**
 * Get recovery XP bonus
 */
export function getRecoveryXP(daysMissed: number): number {
  // More XP for recovering from longer breaks
  // But capped to prevent perverse incentives
  const bonus = Math.min(daysMissed * 10, 50);
  return XP_REWARDS.RECOVERY_COMPLETE + bonus;
}

// ==========================================
// STREAK ANALYSIS
// ==========================================

export interface StreakAnalysis {
  currentStreak: number;
  daysSinceLastActivity: number;
  isStreakBroken: boolean;
  canRecover: boolean;
  recoveryMessage: string;
}

export function analyzeStreak(
  dayRatings: DayRating[],
  streakShieldsAvailable: number
): StreakAnalysis {
  if (dayRatings.length === 0) {
    return {
      currentStreak: 0,
      daysSinceLastActivity: 0,
      isStreakBroken: false,
      canRecover: true,
      recoveryMessage: "You're just getting started! Complete a task to begin your streak.",
    };
  }

  // Sort by date, most recent first
  const sorted = [...dayRatings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mostRecent = sorted[0];
  const today = startOfDay(new Date());
  const lastActivityDay = startOfDay(new Date(mostRecent.date));
  const daysSince = differenceInDays(today, lastActivityDay);

  // Count streak (consecutive non-zero days)
  let streak = 0;
  let previousDate = today;

  for (const rating of sorted) {
    const ratingDate = startOfDay(new Date(rating.date));
    const daysDiff = differenceInDays(previousDate, ratingDate);

    if (daysDiff > 1 && rating.type === 'zero') {
      break;
    }

    if (rating.type !== 'zero') {
      streak++;
    }

    previousDate = ratingDate;
  }

  const isStreakBroken = daysSince > 1;
  const canRecover = isStreakBroken && streakShieldsAvailable >= (daysSince - 1);

  let recoveryMessage: string;

  if (!isStreakBroken) {
    recoveryMessage = streak > 0
      ? `${streak}-day streak going strong! Keep it up!`
      : "Complete a task today to start your streak!";
  } else if (canRecover) {
    const shieldsNeeded = daysSince - 1;
    recoveryMessage = `Use ${shieldsNeeded} streak shield${shieldsNeeded > 1 ? 's' : ''} to protect your streak!`;
  } else {
    recoveryMessage = "Streak paused, but that's okay! Start fresh today.";
  }

  return {
    currentStreak: isStreakBroken && !canRecover ? 0 : streak,
    daysSinceLastActivity: daysSince,
    isStreakBroken,
    canRecover,
    recoveryMessage,
  };
}

// ==========================================
// GENTLE COMEBACK MESSAGES
// ==========================================

/**
 * Shame-free messages for returning users
 */
export function getWelcomeBackMessage(daysMissed: number): {
  message: string;
  subMessage: string;
  suggestedAction: string;
} {
  if (daysMissed === 0) {
    return {
      message: "Welcome back!",
      subMessage: "Ready to build some momentum?",
      suggestedAction: "Start with your easiest task",
    };
  }

  if (daysMissed === 1) {
    return {
      message: "Hey, you're back!",
      subMessage: "One day off is totally fine. You didn't lose anything important.",
      suggestedAction: "Do one small thing to get moving",
    };
  }

  if (daysMissed <= 3) {
    return {
      message: "Welcome back!",
      subMessage: `${daysMissed} days away? That's nothing. Your momentum is still here.`,
      suggestedAction: "Start with something you can finish in 2 minutes",
    };
  }

  if (daysMissed <= 7) {
    return {
      message: "Look who's back!",
      subMessage: "A week away happens to everyone. The system's been waiting for you.",
      suggestedAction: "Let's start fresh with your minimum viable day",
    };
  }

  if (daysMissed <= 30) {
    return {
      message: "Hey! Great to see you!",
      subMessage: "Been a while, but that's okay. No judgment here, just progress.",
      suggestedAction: "Forget the past. What's one thing you can do right now?",
    };
  }

  return {
    message: "Welcome home!",
    subMessage: "Doesn't matter how long you were gone. You're here now, and that's what counts.",
    suggestedAction: "Let's restart together. Pick anything, no matter how small.",
  };
}

// ==========================================
// WIN ARCHAEOLOGY
// ==========================================

export interface PastWin {
  date: Date;
  description: string;
  energyLevel: EnergyLevel;
  tasksCompleted: number;
}

/**
 * Find past wins when user was in similar state
 * "Last time you felt like this, here's what worked"
 */
export function findSimilarPastWins(
  dayRatings: DayRating[],
  tasks: Task[],
  currentEnergyLevel: EnergyLevel,
  limit: number = 3
): PastWin[] {
  // Find days with similar energy that were still successful
  const similarDays = dayRatings
    .filter(dr =>
      dr.energyLevel === currentEnergyLevel &&
      (dr.type === 'perfect' || dr.type === 'good' || dr.type === 'okay')
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return similarDays.map(day => {
    const dayTasks = tasks.filter(t =>
      t.completedAt &&
      startOfDay(t.completedAt).getTime() === startOfDay(day.date).getTime()
    );

    const topTask = dayTasks.sort((a, b) => b.baseXP - a.baseXP)[0];

    return {
      date: day.date,
      description: topTask ? topTask.title : `Completed ${day.tasksCompleted} tasks`,
      energyLevel: day.energyLevel,
      tasksCompleted: day.tasksCompleted,
    };
  });
}

// ==========================================
// PATTERN DETECTION
// ==========================================

export interface ProductivityPattern {
  type: 'positive' | 'warning';
  pattern: string;
  suggestion: string;
}

/**
 * Detect patterns in user behavior
 * Use insights to help, not shame
 */
export function detectPatterns(
  dayRatings: DayRating[],
  tasks: Task[]
): ProductivityPattern[] {
  const patterns: ProductivityPattern[] = [];

  if (dayRatings.length < 7) {
    return patterns;
  }

  // Check for best day of week
  const byDayOfWeek = new Map<number, { good: number; total: number }>();

  dayRatings.forEach(dr => {
    const dow = new Date(dr.date).getDay();
    const current = byDayOfWeek.get(dow) || { good: 0, total: 0 };
    byDayOfWeek.set(dow, {
      good: current.good + (dr.type === 'perfect' || dr.type === 'good' ? 1 : 0),
      total: current.total + 1,
    });
  });

  let bestDay = -1;
  let bestRate = 0;

  byDayOfWeek.forEach((stats, dow) => {
    const rate = stats.good / stats.total;
    if (rate > bestRate && stats.total >= 2) {
      bestRate = rate;
      bestDay = dow;
    }
  });

  if (bestDay >= 0 && bestRate > 0.6) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    patterns.push({
      type: 'positive',
      pattern: `${dayNames[bestDay]}s are your power days!`,
      suggestion: `Schedule important tasks on ${dayNames[bestDay]}s when possible.`,
    });
  }

  // Check for low energy patterns
  const lowEnergyDays = dayRatings.filter(dr => dr.energyLevel <= 2);
  if (lowEnergyDays.length >= 3) {
    const stillProductive = lowEnergyDays.filter(dr =>
      dr.type === 'okay' || dr.type === 'minimum_viable'
    );

    if (stillProductive.length >= 2) {
      patterns.push({
        type: 'positive',
        pattern: "You get things done even on low-energy days!",
        suggestion: "Keep those minimum viable day tasks ready for tough days.",
      });
    }
  }

  // Check for monday/weekend patterns
  const weekendRatings = dayRatings.filter(dr => {
    const dow = new Date(dr.date).getDay();
    return dow === 0 || dow === 6;
  });

  const weekendZeros = weekendRatings.filter(dr => dr.type === 'zero');
  if (weekendZeros.length >= weekendRatings.length * 0.5 && weekendRatings.length >= 4) {
    patterns.push({
      type: 'warning',
      pattern: "Weekends tend to be zero days for you.",
      suggestion: "Consider setting lighter weekend goals or scheduling rest deliberately.",
    });
  }

  return patterns;
}

// ==========================================
// RESTART CEREMONY
// ==========================================

export interface RestartCeremony {
  acknowledgment: string;
  intention: string;
  firstAction: Task | null;
  newStreakStarted: boolean;
}

/**
 * The restart button - psychologically meaningful fresh start
 */
export function initiateRestart(
  userId: string,
  tasks: Task[],
  message: string = "I'm starting fresh."
): RestartCeremony {
  // Find the easiest high-value task to start with
  const candidateTasks = tasks
    .filter(t => t.status === 'pending' && t.estimatedMinutes <= 5)
    .sort((a, b) => {
      // Prioritize high priority + low energy
      const scoreA = (5 - a.energyRequired) + (a.priority === 'high' ? 3 : 0);
      const scoreB = (5 - b.energyRequired) + (b.priority === 'high' ? 3 : 0);
      return scoreB - scoreA;
    });

  const firstAction = candidateTasks[0] || null;

  return {
    acknowledgment: "Slate wiped clean. The past doesn't define your future.",
    intention: message,
    firstAction,
    newStreakStarted: true,
  };
}

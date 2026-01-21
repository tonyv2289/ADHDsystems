// ============================================
// MOMENTUM ENGINE
// The core task and chain management system
// Designed around ADHD brain science
// ============================================

import {
  Task,
  TaskStatus,
  TaskPriority,
  MomentumChain,
  EnergyLevel,
  TaskContext,
  UserContext,
  SmartSuggestion,
  DEFAULTS,
} from '../types';

// Simple ID generator that works in React Native
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// ==========================================
// TASK OPERATIONS
// ==========================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  dueDate?: Date;
  energyRequired?: EnergyLevel;
  contexts?: TaskContext[];
  tags?: string[];
  chainId?: string;
  chainOrder?: number;
}

export function createTask(userId: string, input: CreateTaskInput): Task {
  const priority = input.priority || 'medium';

  return {
    id: generateId(),
    userId,
    title: input.title,
    description: input.description,
    status: 'pending',
    priority,
    estimatedMinutes: input.estimatedMinutes || DEFAULTS.TASK_DURATION_MINUTES,
    dueDate: input.dueDate,
    createdAt: new Date(),
    energyRequired: input.energyRequired || 3,
    contexts: input.contexts || ['anywhere'],
    tags: input.tags || [],
    chainId: input.chainId,
    chainOrder: input.chainOrder,
    baseXP: calculateBaseXP(priority),
    isRecurring: false,
  };
}

function calculateBaseXP(priority: TaskPriority): number {
  const xpMap: Record<TaskPriority, number> = {
    critical: 50,
    high: 25,
    medium: 15,
    low: 10,
    someday: 5,
  };
  return xpMap[priority];
}

export function startTask(task: Task): Task {
  return {
    ...task,
    status: 'in_progress',
  };
}

export function completeTask(task: Task): Task {
  const now = new Date();
  const actualMinutes = task.status === 'in_progress'
    ? Math.round((now.getTime() - (task.scheduledFor?.getTime() || task.createdAt.getTime())) / 60000)
    : task.estimatedMinutes;

  return {
    ...task,
    status: 'completed',
    completedAt: now,
    actualMinutes,
  };
}

export function skipTask(task: Task): Task {
  return {
    ...task,
    status: 'skipped',
  };
}

export function deferTask(task: Task, newDate: Date): Task {
  return {
    ...task,
    status: 'deferred',
    scheduledFor: newDate,
  };
}

// ==========================================
// MICRO-ACTIONS (2-Minute Rule)
// ==========================================

/**
 * Break a task into micro-actions
 * The 2-minute rule on steroids
 */
export function breakIntoMicroActions(task: Task): Task[] {
  const microActions: Task[] = [];
  const estimatedMinutes = task.estimatedMinutes;

  if (estimatedMinutes <= 2) {
    // Already a micro-action
    return [task];
  }

  // Create micro-actions based on common patterns
  const steps = suggestMicroSteps(task);
  const minutesPerStep = Math.ceil(estimatedMinutes / steps.length);

  steps.forEach((step, index) => {
    microActions.push({
      ...task,
      id: generateId(),
      title: step,
      estimatedMinutes: Math.min(minutesPerStep, 2),
      chainId: task.id, // Original task becomes the chain
      chainOrder: index,
      baseXP: Math.ceil(task.baseXP / steps.length),
    });
  });

  return microActions;
}

function suggestMicroSteps(task: Task): string[] {
  const title = task.title.toLowerCase();

  // Common task patterns
  if (title.includes('email') || title.includes('message')) {
    return [
      'Open email/message app',
      'Find the thread',
      'Type first sentence',
      'Complete and send',
    ];
  }

  if (title.includes('clean') || title.includes('organize')) {
    return [
      'Go to the area',
      'Pick up first 5 items',
      'Put them in place',
      'Repeat for remaining items',
    ];
  }

  if (title.includes('write') || title.includes('document')) {
    return [
      'Open the document',
      'Write the first sentence',
      'Write the main point',
      'Quick review',
    ];
  }

  if (title.includes('call') || title.includes('phone')) {
    return [
      'Look up the number/contact',
      'Think of first thing to say',
      'Make the call',
    ];
  }

  // Generic breakdown
  return [
    `Start: ${task.title}`,
    'First small step',
    'Keep going',
    'Finish up',
  ];
}

// ==========================================
// MOMENTUM CHAINS
// ==========================================

export interface CreateChainInput {
  name: string;
  description?: string;
  taskIds: string[];
  triggerType: 'manual' | 'time' | 'location' | 'after_task';
  triggerTime?: string;
  triggerLocation?: string;
  triggerTaskId?: string;
}

export function createChain(userId: string, input: CreateChainInput): MomentumChain {
  return {
    id: generateId(),
    userId,
    name: input.name,
    description: input.description,
    taskIds: input.taskIds,
    isActive: true,
    createdAt: new Date(),
    triggerType: input.triggerType,
    triggerTime: input.triggerTime,
    triggerLocation: input.triggerLocation,
    triggerTaskId: input.triggerTaskId,
    timesCompleted: 0,
    averageCompletionTime: 0,
  };
}

export function getNextChainTask(chain: MomentumChain, tasks: Task[]): Task | null {
  const chainTasks = tasks
    .filter(t => chain.taskIds.includes(t.id))
    .sort((a, b) => (a.chainOrder || 0) - (b.chainOrder || 0));

  return chainTasks.find(t => t.status === 'pending') || null;
}

export function getChainProgress(chain: MomentumChain, tasks: Task[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const chainTasks = tasks.filter(t => chain.taskIds.includes(t.id));
  const completed = chainTasks.filter(t => t.status === 'completed').length;
  const total = chainTasks.length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function isChainComplete(chain: MomentumChain, tasks: Task[]): boolean {
  const progress = getChainProgress(chain, tasks);
  return progress.completed === progress.total;
}

// ==========================================
// SMART TASK SURFACING
// ==========================================

/**
 * Get the right tasks for the right moment
 * This is the Context Engine in action
 */
export function getSuggestedTasks(
  tasks: Task[],
  context: UserContext,
  limit: number = 5
): SmartSuggestion[] {
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const scored = pendingTasks.map(task => ({
    taskId: task.id,
    score: calculateTaskScore(task, context),
    reasons: getScoreReasons(task, context),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function calculateTaskScore(task: Task, context: UserContext): number {
  let score = 0;

  // Priority weight (0-40 points)
  const priorityScores: Record<TaskPriority, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
    someday: 5,
  };
  score += priorityScores[task.priority];

  // Energy match (0-25 points)
  if (context.energyLevel) {
    const energyDiff = Math.abs(task.energyRequired - context.energyLevel);
    score += (5 - energyDiff) * 5; // Perfect match = 25, off by 4 = 5
  }

  // Time fit (0-20 points)
  if (context.availableMinutes) {
    if (task.estimatedMinutes <= context.availableMinutes) {
      // Task fits in available time
      score += 20;
    } else if (task.estimatedMinutes <= context.availableMinutes * 1.5) {
      // Task might fit
      score += 10;
    }
  }

  // Context match (0-15 points)
  if (context.location) {
    const contextMatch = task.contexts.some(c =>
      c === 'anywhere' || c === context.location
    );
    if (contextMatch) score += 15;
  }

  // Due date urgency (0-30 points bonus)
  if (task.dueDate) {
    const hoursUntilDue = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilDue < 0) {
      score += 30; // Overdue! High priority
    } else if (hoursUntilDue < 24) {
      score += 25;
    } else if (hoursUntilDue < 72) {
      score += 15;
    } else if (hoursUntilDue < 168) { // 1 week
      score += 5;
    }
  }

  return score;
}

function getScoreReasons(task: Task, context: UserContext): string[] {
  const reasons: string[] = [];

  if (task.priority === 'critical') reasons.push('Critical priority');
  if (task.priority === 'high') reasons.push('High priority');

  if (context.energyLevel && task.energyRequired <= context.energyLevel) {
    reasons.push('Matches your energy');
  }

  if (context.availableMinutes && task.estimatedMinutes <= context.availableMinutes) {
    reasons.push(`Fits in ${context.availableMinutes} min`);
  }

  if (task.dueDate) {
    const hoursUntilDue = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilDue < 24) reasons.push('Due soon!');
  }

  if (task.estimatedMinutes <= 2) {
    reasons.push('Quick win');
  }

  return reasons;
}

// ==========================================
// THE BIG 3
// ==========================================

/**
 * Get the three most important tasks for today
 * Inspired by "Eat That Frog" but ADHD-friendly
 */
export function getBigThree(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayTasks = tasks.filter(t => {
    if (t.status !== 'pending') return false;

    // Tasks due today or overdue
    if (t.dueDate && t.dueDate <= today) return true;

    // Tasks scheduled for today
    if (t.scheduledFor) {
      const scheduled = new Date(t.scheduledFor);
      return scheduled.toDateString() === new Date().toDateString();
    }

    // High priority tasks
    return t.priority === 'critical' || t.priority === 'high';
  });

  // Sort by priority, then due date
  return todayTasks
    .sort((a, b) => {
      const priorityOrder: Record<TaskPriority, number> = {
        critical: 0, high: 1, medium: 2, low: 3, someday: 4
      };

      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      return 0;
    })
    .slice(0, 3);
}

// ==========================================
// TASK STATISTICS
// ==========================================

export interface TaskStats {
  totalPending: number;
  totalCompleted: number;
  totalSkipped: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueCount: number;
  streakEligible: number; // tasks that could extend streak today
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const skipped = tasks.filter(t => t.status === 'skipped');

  const totalCompleted = completed.length;
  const total = totalCompleted + skipped.length;
  const completionRate = total > 0 ? totalCompleted / total : 0;

  const completionTimes = completed
    .filter(t => t.actualMinutes)
    .map(t => t.actualMinutes!);
  const averageCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    : 0;

  const now = new Date();
  const overdueCount = pending.filter(t =>
    t.dueDate && t.dueDate < now
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const streakEligible = pending.filter(t =>
    !t.scheduledFor || (t.scheduledFor >= today && t.scheduledFor <= todayEnd)
  ).length;

  return {
    totalPending: pending.length,
    totalCompleted,
    totalSkipped: skipped.length,
    completionRate,
    averageCompletionTime,
    overdueCount,
    streakEligible,
  };
}

// ==========================================
// QUICK CAPTURE
// ==========================================

/**
 * Minimal friction capture - just get the thought down
 */
export function quickCapture(userId: string, text: string): Task {
  // Parse natural language for due dates
  const dueDate = extractDueDate(text);
  const cleanTitle = removeDateFromText(text);

  // Detect priority from language
  const priority = detectPriority(text);

  return createTask(userId, {
    title: cleanTitle,
    priority,
    dueDate,
    estimatedMinutes: 15, // Conservative default
  });
}

function extractDueDate(text: string): Date | undefined {
  const today = new Date();
  const lowerText = text.toLowerCase();

  if (lowerText.includes('today')) {
    return new Date(today.setHours(23, 59, 59, 999));
  }

  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow;
  }

  if (lowerText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return nextWeek;
  }

  // Match "by Friday", "on Monday", etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerText.includes(days[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;

      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      targetDate.setHours(23, 59, 59, 999);
      return targetDate;
    }
  }

  return undefined;
}

function removeDateFromText(text: string): string {
  return text
    .replace(/\b(today|tomorrow|next week)\b/gi, '')
    .replace(/\b(by|on)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectPriority(text: string): TaskPriority {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('critical')) {
    return 'critical';
  }

  if (lowerText.includes('important') || lowerText.includes('priority')) {
    return 'high';
  }

  if (lowerText.includes('when i have time') || lowerText.includes('eventually') || lowerText.includes('someday')) {
    return 'someday';
  }

  return 'medium';
}

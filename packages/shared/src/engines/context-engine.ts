// ============================================
// CONTEXT ENGINE
// Right task, right time, right place, right energy
// Smart surfacing for ADHD brains
// ============================================

// Simple ID generator that works in React Native
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
import {
  Task,
  UserContext,
  SmartSuggestion,
  TaskContext,
  EnergyLevel,
} from '../types';

// ==========================================
// CONTEXT DETECTION
// ==========================================

export interface ContextUpdate {
  location?: UserContext['location'];
  energyLevel?: EnergyLevel;
  mood?: UserContext['mood'];
  availableMinutes?: number;
}

/**
 * Create or update user context
 */
export function updateContext(
  currentContext: UserContext,
  update: ContextUpdate
): UserContext {
  const now = new Date();
  const hour = now.getHours();

  // Determine time of day
  let timeOfDay: UserContext['timeOfDay'];
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    ...currentContext,
    timestamp: now,
    timeOfDay,
    dayOfWeek: now.getDay(),
    ...update,
  };
}

/**
 * Create initial context
 */
export function createInitialContext(userId: string): UserContext {
  const now = new Date();
  const hour = now.getHours();

  let timeOfDay: UserContext['timeOfDay'];
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    userId,
    timestamp: now,
    timeOfDay,
    dayOfWeek: now.getDay(),
    isInFocusMode: false,
  };
}

// ==========================================
// ENERGY MATCHING
// ==========================================

export interface EnergyBasedSuggestion {
  category: string;
  tasks: Task[];
  reason: string;
}

/**
 * Get tasks that match current energy level
 */
export function getEnergyMatchedTasks(
  tasks: Task[],
  energyLevel: EnergyLevel
): EnergyBasedSuggestion[] {
  const pending = tasks.filter(t => t.status === 'pending');
  const suggestions: EnergyBasedSuggestion[] = [];

  if (energyLevel <= 2) {
    // Low energy - suggest easy wins
    const easyTasks = pending.filter(t =>
      t.energyRequired <= 2 && t.estimatedMinutes <= 15
    );

    if (easyTasks.length > 0) {
      suggestions.push({
        category: 'Low Energy Mode',
        tasks: easyTasks.slice(0, 5),
        reason: "Quick wins that don't require much mental effort",
      });
    }

    // Also suggest administrative tasks
    const adminTasks = pending.filter(t =>
      t.tags.includes('admin') || t.tags.includes('routine')
    );

    if (adminTasks.length > 0) {
      suggestions.push({
        category: 'Mindless Tasks',
        tasks: adminTasks.slice(0, 3),
        reason: 'Tasks you can do on autopilot',
      });
    }
  } else if (energyLevel === 3) {
    // Medium energy - balanced suggestions
    const mediumTasks = pending.filter(t =>
      t.energyRequired <= 3 && t.estimatedMinutes <= 30
    );

    suggestions.push({
      category: 'Good Match',
      tasks: mediumTasks.slice(0, 5),
      reason: 'Tasks that match your current energy',
    });
  } else {
    // High energy - capitalize on it
    const challengingTasks = pending.filter(t =>
      t.energyRequired >= 4 ||
      t.priority === 'critical' ||
      t.priority === 'high'
    );

    if (challengingTasks.length > 0) {
      suggestions.push({
        category: 'High Energy Power Hour',
        tasks: challengingTasks.slice(0, 5),
        reason: "You've got the energy - tackle the hard stuff!",
      });
    }

    // Also suggest deep work
    const deepWork = pending.filter(t =>
      t.estimatedMinutes >= 30 && t.energyRequired >= 3
    );

    if (deepWork.length > 0) {
      suggestions.push({
        category: 'Deep Work',
        tasks: deepWork.slice(0, 3),
        reason: 'Perfect time for focused, challenging work',
      });
    }
  }

  return suggestions;
}

// ==========================================
// LOCATION AWARENESS
// ==========================================

/**
 * Get tasks appropriate for current location
 */
export function getLocationMatchedTasks(
  tasks: Task[],
  location: UserContext['location']
): Task[] {
  if (!location) return tasks;

  return tasks.filter(t => {
    // "anywhere" tasks match all locations
    if (t.contexts.includes('anywhere')) return true;

    // Map locations to contexts
    const locationContextMap: Record<string, TaskContext[]> = {
      home: ['home', 'computer', 'phone'],
      work: ['work', 'computer', 'phone'],
      transit: ['phone', 'anywhere'],
      errand: ['errand', 'phone'],
      other: ['anywhere', 'phone'],
    };

    const validContexts = locationContextMap[location] || ['anywhere'];
    return t.contexts.some(c => validContexts.includes(c));
  });
}

// ==========================================
// TIME-BASED FILTERING
// ==========================================

/**
 * Get tasks that fit in available time
 */
export function getTimeFittingTasks(
  tasks: Task[],
  availableMinutes: number
): { fits: Task[]; almostFits: Task[]; tooLong: Task[] } {
  const pending = tasks.filter(t => t.status === 'pending');

  return {
    fits: pending.filter(t => t.estimatedMinutes <= availableMinutes),
    almostFits: pending.filter(t =>
      t.estimatedMinutes > availableMinutes &&
      t.estimatedMinutes <= availableMinutes * 1.5
    ),
    tooLong: pending.filter(t => t.estimatedMinutes > availableMinutes * 1.5),
  };
}

/**
 * Time of day based suggestions
 */
export function getTimeOfDaySuggestions(
  tasks: Task[],
  timeOfDay: UserContext['timeOfDay']
): Task[] {
  const pending = tasks.filter(t => t.status === 'pending');

  switch (timeOfDay) {
    case 'morning':
      // Morning: High priority and challenging tasks
      return pending
        .filter(t =>
          t.priority === 'critical' ||
          t.priority === 'high' ||
          t.energyRequired >= 4
        )
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, someday: 4 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

    case 'afternoon':
      // Afternoon: Collaborative and medium-effort tasks
      return pending
        .filter(t =>
          t.energyRequired >= 2 &&
          t.energyRequired <= 4
        )
        .slice(0, 10);

    case 'evening':
      // Evening: Winding down, lighter tasks
      return pending
        .filter(t =>
          t.energyRequired <= 3 &&
          !['critical', 'high'].includes(t.priority)
        )
        .slice(0, 10);

    case 'night':
      // Night: Optional light tasks or planning for tomorrow
      return pending
        .filter(t =>
          t.energyRequired <= 2 ||
          t.tags.includes('planning') ||
          t.tags.includes('review')
        )
        .slice(0, 5);

    default:
      return pending;
  }
}

// ==========================================
// MOOD MATCHING
// ==========================================

export function getMoodMatchedTasks(
  tasks: Task[],
  mood: UserContext['mood']
): Task[] {
  const pending = tasks.filter(t => t.status === 'pending');

  if (!mood) return pending;

  switch (mood) {
    case 'focused':
      // Deep work and challenging tasks
      return pending.filter(t =>
        t.estimatedMinutes >= 25 ||
        t.energyRequired >= 4
      );

    case 'scattered':
      // Quick, varied tasks to match scattered attention
      return pending
        .filter(t => t.estimatedMinutes <= 10)
        .sort(() => Math.random() - 0.5); // Randomize for variety

    case 'creative':
      // Open-ended and creative tasks
      return pending.filter(t =>
        t.tags.includes('creative') ||
        t.tags.includes('brainstorm') ||
        t.tags.includes('writing') ||
        t.tags.includes('design')
      );

    case 'tired':
      // Absolute minimum effort tasks
      return pending.filter(t =>
        t.energyRequired === 1 &&
        t.estimatedMinutes <= 5
      );

    case 'anxious':
      // Concrete, completion-focused tasks (not open-ended)
      return pending.filter(t =>
        t.estimatedMinutes <= 15 &&
        !t.tags.includes('creative') &&
        !t.tags.includes('brainstorm')
      );

    case 'motivated':
      // Challenging, high-impact tasks
      return pending.filter(t =>
        t.priority === 'critical' ||
        t.priority === 'high' ||
        t.energyRequired >= 4
      );

    default:
      return pending;
  }
}

// ==========================================
// SMART SUGGESTION ENGINE
// ==========================================

/**
 * The main suggestion engine - combines all context factors
 */
export function getSmartSuggestions(
  tasks: Task[],
  context: UserContext,
  limit: number = 5
): SmartSuggestion[] {
  const pending = tasks.filter(t => t.status === 'pending');

  const scored = pending.map(task => {
    let score = 0;
    const reasons: string[] = [];

    // Priority score (0-40)
    const priorityScores = { critical: 40, high: 30, medium: 20, low: 10, someday: 5 };
    score += priorityScores[task.priority];
    if (task.priority === 'critical' || task.priority === 'high') {
      reasons.push(`${task.priority} priority`);
    }

    // Energy match (0-25)
    if (context.energyLevel) {
      const diff = Math.abs(task.energyRequired - context.energyLevel);
      if (diff === 0) {
        score += 25;
        reasons.push('Perfect energy match');
      } else if (diff === 1) {
        score += 20;
      } else {
        score += Math.max(0, 25 - diff * 5);
      }
    }

    // Time fit (0-20)
    if (context.availableMinutes) {
      if (task.estimatedMinutes <= context.availableMinutes) {
        score += 20;
        reasons.push(`Fits in ${context.availableMinutes}min`);
      } else if (task.estimatedMinutes <= context.availableMinutes * 1.5) {
        score += 10;
      }
    }

    // Location match (0-15)
    if (context.location) {
      const locationContexts: Record<string, TaskContext[]> = {
        home: ['home', 'anywhere'],
        work: ['work', 'anywhere'],
        transit: ['phone', 'anywhere'],
        errand: ['errand', 'anywhere'],
        other: ['anywhere'],
      };
      const valid = locationContexts[context.location] || [];
      if (task.contexts.some(c => valid.includes(c))) {
        score += 15;
        reasons.push('Location appropriate');
      }
    }

    // Mood match (0-15)
    if (context.mood) {
      const moodMatch = checkMoodMatch(task, context.mood);
      if (moodMatch) {
        score += 15;
        reasons.push(`Good for ${context.mood} mood`);
      }
    }

    // Time of day match (0-10)
    const todMatch = checkTimeOfDayMatch(task, context.timeOfDay);
    if (todMatch) {
      score += 10;
      reasons.push(todMatch);
    }

    // Due date urgency (0-30 bonus)
    if (task.dueDate) {
      const hoursUntil = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 0) {
        score += 30;
        reasons.push('Overdue!');
      } else if (hoursUntil < 24) {
        score += 25;
        reasons.push('Due today');
      } else if (hoursUntil < 72) {
        score += 15;
        reasons.push('Due soon');
      }
    }

    // Quick win bonus
    if (task.estimatedMinutes <= 5) {
      score += 10;
      reasons.push('Quick win');
    }

    return {
      taskId: task.id,
      score,
      reasons,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function checkMoodMatch(task: Task, mood: UserContext['mood']): boolean {
  switch (mood) {
    case 'focused':
      return task.estimatedMinutes >= 25 || task.energyRequired >= 4;
    case 'scattered':
      return task.estimatedMinutes <= 10;
    case 'creative':
      return task.tags.some(t => ['creative', 'brainstorm', 'writing', 'design'].includes(t));
    case 'tired':
      return task.energyRequired <= 2 && task.estimatedMinutes <= 10;
    case 'anxious':
      return task.estimatedMinutes <= 15 && !task.tags.includes('creative');
    case 'motivated':
      return task.priority === 'critical' || task.priority === 'high';
    default:
      return false;
  }
}

function checkTimeOfDayMatch(
  task: Task,
  timeOfDay: UserContext['timeOfDay']
): string | null {
  switch (timeOfDay) {
    case 'morning':
      if (task.priority === 'critical' || task.priority === 'high') {
        return 'Morning is for priorities';
      }
      if (task.energyRequired >= 4) {
        return 'Best time for hard work';
      }
      break;

    case 'afternoon':
      if (task.energyRequired >= 2 && task.energyRequired <= 4) {
        return 'Good afternoon task';
      }
      break;

    case 'evening':
      if (task.energyRequired <= 3) {
        return 'Light evening task';
      }
      break;

    case 'night':
      if (task.energyRequired <= 2) {
        return 'Night-appropriate';
      }
      break;
  }

  return null;
}

// ==========================================
// FOCUS MODE
// ==========================================

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: Date;
  plannedDuration: number;
  actualDuration?: number;
  completed: boolean;
  distractions: number;
}

export function startFocusSession(
  userId: string,
  durationMinutes: number,
  taskId?: string
): FocusSession {
  return {
    id: generateId(),
    userId,
    taskId,
    startTime: new Date(),
    plannedDuration: durationMinutes,
    completed: false,
    distractions: 0,
  };
}

export function endFocusSession(
  session: FocusSession,
  completed: boolean = true
): FocusSession {
  const now = new Date();
  const actualDuration = Math.round(
    (now.getTime() - session.startTime.getTime()) / 60000
  );

  return {
    ...session,
    actualDuration,
    completed,
  };
}

export function recordDistraction(session: FocusSession): FocusSession {
  return {
    ...session,
    distractions: session.distractions + 1,
  };
}

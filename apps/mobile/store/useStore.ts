// ============================================
// MOMENTUM STATE STORE
// Zustand-powered state management
// ============================================

import { create } from 'zustand';
import {
  Task,
  MomentumChain,
  Streak,
  UserContext,
  UserStats,
  UserSettings,
  DailyQuest,
  DayRating,
  Achievement,
  UserAchievement,
  DEFAULTS,
  EnergyLevel,
} from '@momentum/shared';
import {
  createTask,
  completeTask,
  startTask,
  CreateTaskInput,
  quickCapture,
  getBigThree,
} from '@momentum/shared';
import {
  calculateTaskXP,
  updateStreak,
  generateDailyQuests,
  checkForNewAchievements,
  createUserAchievement,
  getXPProgress,
  XPReward,
} from '@momentum/shared';
import {
  updateContext,
  createInitialContext,
  getSmartSuggestions,
} from '@momentum/shared';
import {
  evaluateDay,
  getWelcomeBackMessage,
  analyzeStreak,
} from '@momentum/shared';

// ==========================================
// STORE INTERFACE
// ==========================================

interface MomentumState {
  // User
  userId: string;
  stats: UserStats;
  settings: UserSettings;

  // Tasks
  tasks: Task[];
  chains: MomentumChain[];

  // Gamification
  streaks: Streak[];
  dailyQuest: DailyQuest | null;
  achievements: UserAchievement[];
  recentXPReward: XPReward | null;

  // Context
  context: UserContext;
  dayRatings: DayRating[];

  // UI State
  isLoading: boolean;
  showCelebration: boolean;
  celebrationMessage: string;

  // Actions - Tasks
  addTask: (input: CreateTaskInput) => void;
  quickAdd: (text: string) => void;
  startTaskAction: (taskId: string) => void;
  completeTaskAction: (taskId: string) => void;
  skipTask: (taskId: string) => void;

  // Actions - Context
  setEnergyLevel: (level: EnergyLevel) => void;
  setMood: (mood: UserContext['mood']) => void;
  setAvailableMinutes: (minutes: number) => void;

  // Actions - Gamification
  refreshDailyQuests: () => void;
  celebrateAchievement: (achievementId: string) => void;
  dismissCelebration: () => void;

  // Getters
  getBigThree: () => Task[];
  getSuggestions: () => { taskId: string; score: number; reasons: string[] }[];
  getXPProgress: () => ReturnType<typeof getXPProgress>;
  getWelcomeMessage: () => ReturnType<typeof getWelcomeBackMessage>;
  getStreakAnalysis: () => ReturnType<typeof analyzeStreak>;
}

// ==========================================
// DEFAULT VALUES
// ==========================================

const defaultStats: UserStats = {
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  totalTasksCompleted: 0,
  totalMomentumChains: 0,
  perfectDays: 0,
  goodEnoughDays: 0,
  zeroDays: 0,
  averageEnergyLevel: 3,
  mostProductiveHour: 10,
  mostProductiveDay: 'Tuesday',
};

const defaultSettings: UserSettings = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  timezone: 'America/New_York',
  notificationsEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  showXP: true,
  showLevel: true,
  streakShieldsEnabled: true,
  profilePublic: false,
  shareProgressWithPartners: true,
  defaultTaskDuration: DEFAULTS.TASK_DURATION_MINUTES,
  transitionTimePadding: DEFAULTS.TRANSITION_PADDING_MINUTES,
  minimumViableDay: [],
};

// ==========================================
// STORE IMPLEMENTATION
// ==========================================

export const useStore = create<MomentumState>((set, get) => ({
  // Initial state
  userId: 'user-1', // Would come from auth
  stats: defaultStats,
  settings: defaultSettings,
  tasks: [],
  chains: [],
  streaks: [{
    id: 'main-streak',
    userId: 'user-1',
    type: 'daily',
    currentCount: 0,
    longestCount: 0,
    lastActivityDate: new Date(),
    shieldsAvailable: DEFAULTS.STREAK_SHIELD_COUNT,
    shieldsUsed: 0,
    startedAt: new Date(),
  }],
  dailyQuest: null,
  achievements: [],
  recentXPReward: null,
  context: createInitialContext('user-1'),
  dayRatings: [],
  isLoading: false,
  showCelebration: false,
  celebrationMessage: '',

  // Task Actions
  addTask: (input) => {
    const { userId } = get();
    const newTask = createTask(userId, input);
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
  },

  quickAdd: (text) => {
    const { userId } = get();
    const newTask = quickCapture(userId, text);
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
  },

  startTaskAction: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? startTask(t) : t
      ),
    }));
  },

  completeTaskAction: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const completedTask = completeTask(task);
    const mainStreak = state.streaks.find((s) => s.type === 'daily');

    // Calculate XP reward
    const xpReward = calculateTaskXP(completedTask, state.stats, mainStreak || null);

    // Update stats
    const newStats: UserStats = {
      ...state.stats,
      totalXP: state.stats.totalXP + xpReward.total,
      totalTasksCompleted: state.stats.totalTasksCompleted + 1,
    };

    // Check for new achievements
    const newAchievements = checkForNewAchievements(newStats, state.achievements);

    // Add XP from achievements
    const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
    newStats.totalXP += achievementXP;

    // Update level
    const xpProgress = getXPProgress(newStats.totalXP);
    newStats.level = xpProgress.currentLevel.level;

    // Create user achievement records
    const newUserAchievements = newAchievements.map((a) =>
      createUserAchievement(state.userId, a)
    );

    // Update streak
    const todayTasks = state.tasks.filter((t) =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
    );

    let updatedStreaks = state.streaks;
    if (mainStreak) {
      const updatedStreak = updateStreak(mainStreak, todayTasks.length + 1, 1);
      updatedStreaks = state.streaks.map((s) =>
        s.id === mainStreak.id ? updatedStreak : s
      );
      newStats.currentStreak = updatedStreak.currentCount;
      newStats.longestStreak = Math.max(newStats.longestStreak, updatedStreak.longestCount);
    }

    // Show celebration if level up or achievement
    let showCelebration = false;
    let celebrationMessage = '';

    if (xpReward.levelUp) {
      showCelebration = true;
      celebrationMessage = `Level Up! You're now level ${xpReward.levelUp.to}!`;
    } else if (newAchievements.length > 0) {
      showCelebration = true;
      celebrationMessage = `Achievement Unlocked: ${newAchievements[0].name}!`;
    } else if (xpReward.total >= 50) {
      showCelebration = true;
      celebrationMessage = `+${xpReward.total} XP! ${xpReward.bonuses.map((b) => b.reason).join(' ')}`;
    }

    set({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? completedTask : t
      ),
      stats: newStats,
      streaks: updatedStreaks,
      achievements: [...state.achievements, ...newUserAchievements],
      recentXPReward: xpReward,
      showCelebration,
      celebrationMessage,
    });
  },

  skipTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'skipped' as const } : t
      ),
    }));
  },

  // Context Actions
  setEnergyLevel: (level) => {
    set((state) => ({
      context: updateContext(state.context, { energyLevel: level }),
    }));
  },

  setMood: (mood) => {
    set((state) => ({
      context: updateContext(state.context, { mood }),
    }));
  },

  setAvailableMinutes: (minutes) => {
    set((state) => ({
      context: updateContext(state.context, { availableMinutes: minutes }),
    }));
  },

  // Gamification Actions
  refreshDailyQuests: () => {
    const { userId, stats } = get();
    const quests = generateDailyQuests(userId, stats);
    set({ dailyQuest: quests });
  },

  celebrateAchievement: (achievementId) => {
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.achievementId === achievementId ? { ...a, celebrated: true } : a
      ),
    }));
  },

  dismissCelebration: () => {
    set({ showCelebration: false, celebrationMessage: '' });
  },

  // Getters
  getBigThree: () => {
    const { tasks } = get();
    return getBigThree(tasks);
  },

  getSuggestions: () => {
    const { tasks, context } = get();
    return getSmartSuggestions(tasks, context, 5);
  },

  getXPProgress: () => {
    const { stats } = get();
    return getXPProgress(stats.totalXP);
  },

  getWelcomeMessage: () => {
    const { dayRatings } = get();
    if (dayRatings.length === 0) return getWelcomeBackMessage(0);

    const lastRating = dayRatings.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const daysSince = Math.floor(
      (Date.now() - new Date(lastRating.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    return getWelcomeBackMessage(daysSince);
  },

  getStreakAnalysis: () => {
    const { dayRatings, streaks } = get();
    const mainStreak = streaks.find((s) => s.type === 'daily');
    return analyzeStreak(dayRatings, mainStreak?.shieldsAvailable || 0);
  },
}));

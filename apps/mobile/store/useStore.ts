// ============================================
// MOMENTUM STATE STORE
// Zustand-powered state management with persistence
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Import domain types
import {
  Client,
  Property,
  Job,
  TimeEntry,
  Invoice,
  Tenant,
  MaintenanceItem,
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

  // Domains - Business & Life
  clients: Client[];
  properties: Property[];
  job: Job | null;
  timeEntries: TimeEntry[];
  invoices: Invoice[];

  // Habits
  habits: Habit[];

  // UI State (not persisted)
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
  addXP: (amount: number, reason: string) => void;
  refreshDailyQuests: () => void;
  celebrateAchievement: (achievementId: string) => void;
  dismissCelebration: () => void;

  // Actions - Habits
  addHabit: (habit: Omit<Habit, 'id'>) => void;
  toggleHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;

  // Actions - Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;

  // Actions - Properties
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;

  // Actions - Time Tracking
  startTimeEntry: (clientId: string, description: string) => void;
  stopTimeEntry: (entryId: string) => void;

  // Getters
  getBigThree: () => Task[];
  getSuggestions: () => { taskId: string; score: number; reasons: string[] }[];
  getXPProgress: () => ReturnType<typeof getXPProgress>;
  getWelcomeMessage: () => ReturnType<typeof getWelcomeBackMessage>;
  getStreakAnalysis: () => ReturnType<typeof analyzeStreak>;
}

// ==========================================
// HABIT TYPE
// ==========================================

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  completedDates: string[];
  xpPerCompletion: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  createdAt: Date;
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

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ==========================================
// STORE IMPLEMENTATION WITH PERSISTENCE
// ==========================================

export const useStore = create<MomentumState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: 'user-1',
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

      // Domains
      clients: [],
      properties: [],
      job: null,
      timeEntries: [],
      invoices: [],

      // Habits
      habits: [
        {
          id: '1',
          name: 'Morning Meditation',
          icon: '🧘',
          color: '#8b5cf6',
          frequency: 'daily',
          currentStreak: 0,
          longestStreak: 0,
          completedToday: false,
          completedDates: [],
          xpPerCompletion: 15,
          timeOfDay: 'morning',
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Exercise',
          icon: '💪',
          color: '#22c55e',
          frequency: 'weekdays',
          currentStreak: 0,
          longestStreak: 0,
          completedToday: false,
          completedDates: [],
          xpPerCompletion: 25,
          timeOfDay: 'morning',
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Review Client Tasks',
          icon: '📋',
          color: '#3b82f6',
          frequency: 'weekdays',
          currentStreak: 0,
          longestStreak: 0,
          completedToday: false,
          completedDates: [],
          xpPerCompletion: 20,
          timeOfDay: 'morning',
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'Check Rental Properties',
          icon: '🏠',
          color: '#06b6d4',
          frequency: 'weekends',
          currentStreak: 0,
          longestStreak: 0,
          completedToday: false,
          completedDates: [],
          xpPerCompletion: 20,
          timeOfDay: 'anytime',
          createdAt: new Date(),
        },
      ],

      // UI State
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
      addXP: (amount, reason) => {
        set((state) => {
          const newTotalXP = state.stats.totalXP + amount;
          const xpProgress = getXPProgress(newTotalXP);
          const leveledUp = xpProgress.currentLevel.level > state.stats.level;

          return {
            stats: {
              ...state.stats,
              totalXP: newTotalXP,
              level: xpProgress.currentLevel.level,
            },
            showCelebration: leveledUp,
            celebrationMessage: leveledUp
              ? `Level Up! You're now level ${xpProgress.currentLevel.level}!`
              : '',
          };
        });
      },

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

      // Habit Actions
      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: generateId(),
          currentStreak: 0,
          longestStreak: 0,
          completedToday: false,
          completedDates: [],
          createdAt: new Date(),
        };
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },

      toggleHabit: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return;

        const today = new Date().toISOString().split('T')[0];
        const wasCompleted = habit.completedToday;

        if (!wasCompleted) {
          // Award XP for completing the habit
          const newTotalXP = state.stats.totalXP + habit.xpPerCompletion;
          const xpProgress = getXPProgress(newTotalXP);

          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId
                ? {
                    ...h,
                    completedToday: true,
                    currentStreak: h.currentStreak + 1,
                    longestStreak: Math.max(h.longestStreak, h.currentStreak + 1),
                    completedDates: [...h.completedDates, today],
                  }
                : h
            ),
            stats: {
              ...state.stats,
              totalXP: newTotalXP,
              level: xpProgress.currentLevel.level,
            },
          }));
        } else {
          // Undo completion
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId
                ? {
                    ...h,
                    completedToday: false,
                    currentStreak: Math.max(0, h.currentStreak - 1),
                    completedDates: h.completedDates.filter((d) => d !== today),
                  }
                : h
            ),
            stats: {
              ...state.stats,
              totalXP: Math.max(0, state.stats.totalXP - habit.xpPerCompletion),
            },
          }));
        }
      },

      deleteHabit: (habitId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
        }));
      },

      // Client Actions
      addClient: (clientData) => {
        const newClient: Client = {
          ...clientData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Client;
        set((state) => ({
          clients: [...state.clients, newClient],
        }));
      },

      updateClient: (clientId, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));
      },

      // Property Actions
      addProperty: (propertyData) => {
        const newProperty: Property = {
          ...propertyData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Property;
        set((state) => ({
          properties: [...state.properties, newProperty],
        }));
      },

      updateProperty: (propertyId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      // Time Tracking Actions
      startTimeEntry: (clientId, description) => {
        const newEntry: TimeEntry = {
          id: generateId(),
          clientId,
          description,
          startTime: new Date(),
          endTime: null,
          duration: 0,
          billable: true,
          invoiced: false,
          createdAt: new Date(),
        } as TimeEntry;
        set((state) => ({
          timeEntries: [...state.timeEntries, newEntry],
        }));
      },

      stopTimeEntry: (entryId) => {
        const now = new Date();
        set((state) => ({
          timeEntries: state.timeEntries.map((e) => {
            if (e.id === entryId && !e.endTime) {
              const duration = Math.round((now.getTime() - new Date(e.startTime).getTime()) / 60000);
              return { ...e, endTime: now, duration };
            }
            return e;
          }),
        }));
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
    }),
    {
      name: 'momentum-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        userId: state.userId,
        stats: state.stats,
        settings: state.settings,
        tasks: state.tasks,
        chains: state.chains,
        streaks: state.streaks,
        achievements: state.achievements,
        dayRatings: state.dayRatings,
        clients: state.clients,
        properties: state.properties,
        job: state.job,
        timeEntries: state.timeEntries,
        invoices: state.invoices,
        habits: state.habits,
      }),
    }
  )
);

// Export Habit type for use in components
export type { Habit };

// ============================================
// MOMENTUM: Core Type Definitions
// The ADHD Operating System
// ============================================

// ==========================================
// USER & PROFILE
// ==========================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  // Time preferences
  wakeTime: string; // "07:00"
  sleepTime: string; // "23:00"
  timezone: string;

  // Notification preferences
  notificationsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Gamification preferences
  showXP: boolean;
  showLevel: boolean;
  streakShieldsEnabled: boolean;

  // Privacy
  profilePublic: boolean;
  shareProgressWithPartners: boolean;

  // ADHD-specific
  defaultTaskDuration: number; // minutes
  transitionTimePadding: number; // minutes to add between events
  minimumViableDay: string[]; // task IDs that count as "not zero"
}

export interface UserStats {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  totalMomentumChains: number;
  perfectDays: number;
  goodEnoughDays: number;
  zeroDays: number;
  averageEnergyLevel: number;
  mostProductiveHour: number;
  mostProductiveDay: string;
}

// ==========================================
// MOMENTUM ENGINE - Tasks & Chains
// ==========================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'deferred';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'someday';
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type TaskContext = 'home' | 'work' | 'errand' | 'anywhere' | 'phone' | 'computer';

export interface Task {
  id: string;
  userId: string;

  // Domain/Project association
  domainId?: string;
  projectId?: string;

  // Core
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Time
  estimatedMinutes: number;
  actualMinutes?: number;
  dueDate?: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;

  // Context (for smart surfacing)
  energyRequired: EnergyLevel;
  contexts: TaskContext[];
  tags: string[];

  // Momentum chain
  chainId?: string;
  chainOrder?: number;
  triggeredBy?: string; // task ID
  triggers?: string[]; // task IDs

  // Gamification
  baseXP: number;
  bonusXP?: number;

  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  parentTaskId?: string; // for recurring instances
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // every N days/weeks/etc
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: Date;
  maxOccurrences?: number;
}

export interface MomentumChain {
  id: string;
  userId: string;
  name: string;
  description?: string;
  taskIds: string[];
  isActive: boolean;
  createdAt: Date;

  // Trigger conditions
  triggerType: 'manual' | 'time' | 'location' | 'after_task';
  triggerTime?: string; // "07:00"
  triggerLocation?: string;
  triggerTaskId?: string;

  // Stats
  timesCompleted: number;
  averageCompletionTime: number;
}

// ==========================================
// DOPAMINE DASHBOARD - Gamification
// ==========================================

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  taskId?: string;
  achievementId?: string;
  timestamp: Date;
  isBonus: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // Unlock conditions
  condition: AchievementCondition;

  // Hidden achievements are a surprise
  isHidden: boolean;
}

export interface AchievementCondition {
  type: 'tasks_completed' | 'streak' | 'xp_earned' | 'chains_completed' |
        'perfect_days' | 'recovery' | 'early_bird' | 'night_owl' | 'custom';
  threshold: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
}

export interface UserAchievement {
  id: string;
  odajId: string;
  achievementId: string;
  unlockedAt: Date;
  celebrated: boolean; // shown to user?
}

export interface DailyQuest {
  id: string;
  userId: string;
  date: Date;
  quests: Quest[];
  completed: number;
  total: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'complete_tasks' | 'earn_xp' | 'maintain_streak' | 'chain_completion' | 'focus_time';
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

export interface LootDrop {
  id: string;
  userId: string;
  type: 'xp_bonus' | 'streak_shield' | 'cosmetic' | 'power_up';
  value: number | string;
  taskId: string;
  claimedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Streak {
  id: string;
  userId: string;
  type: 'daily' | 'chain' | 'focus';
  currentCount: number;
  longestCount: number;
  lastActivityDate: Date;
  shieldsAvailable: number;
  shieldsUsed: number;
  startedAt: Date;
}

// ==========================================
// TIME ANCHOR SYSTEM
// ==========================================

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'task' | 'event' | 'focus' | 'break' | 'transition';
  taskId?: string;
  isFlexible: boolean;
  transitionMinutes: number; // auto-added buffer
}

export interface TimeDebt {
  id: string;
  userId: string;
  description: string;
  promisedDate: Date;
  estimatedMinutes: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'paid' | 'defaulted';
}

export interface TimeAwareness {
  userId: string;
  currentTime: Date;
  nextEvent?: TimeBlock;
  minutesUntilNextEvent?: number;
  currentActivity?: TimeBlock;
  todayRemaining: number; // minutes
  todayUsed: number; // minutes
  dayProgress: number; // 0-100%
}

// ==========================================
// FRICTION MANAGER
// ==========================================

export interface FrictionRule {
  id: string;
  userId: string;
  type: 'reduce' | 'add';
  target: 'app' | 'website' | 'action' | 'location';
  targetIdentifier: string; // app bundle ID, URL pattern, etc.

  // For reduce friction
  quickAction?: string;
  shortcut?: string;

  // For add friction
  delaySeconds?: number;
  requireConfirmation?: boolean;
  showIntention?: boolean;
  maxDailyUses?: number;

  isActive: boolean;
  schedule?: FrictionSchedule;
}

export interface FrictionSchedule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface AppUsage {
  id: string;
  userId: string;
  appIdentifier: string;
  appName: string;
  date: Date;
  totalMinutes: number;
  sessionCount: number;
  category: 'productive' | 'neutral' | 'distracting';
}

// ==========================================
// RECOVERY PROTOCOL
// ==========================================

export interface DayRating {
  id: string;
  userId: string;
  date: Date;
  type: 'perfect' | 'good' | 'okay' | 'minimum_viable' | 'zero';
  energyLevel: EnergyLevel;
  tasksCompleted: number;
  xpEarned: number;
  notes?: string;
}

export interface Recovery {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  daysMissed: number;
  recoveryTaskId?: string;
  successful: boolean;
}

export interface MinimumViableDay {
  id: string;
  userId: string;
  taskIds: string[]; // which tasks count as "not zero"
  description: string;
}

// ==========================================
// STAKES ENGINE
// ==========================================

export interface Commitment {
  id: string;
  userId: string;
  description: string;
  deadline: Date;
  stake: Stake;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Stake {
  type: 'money' | 'social' | 'reputation';
  amount?: number; // for money
  recipient?: string; // charity or anti-charity
  visibility?: 'private' | 'partners' | 'public';
}

export interface AccountabilityPartner {
  id: string;
  userId: string;
  partnerUserId: string;
  partnerName: string;
  relationship: 'friend' | 'family' | 'coach' | 'coworker';
  permissions: PartnerPermissions;
  createdAt: Date;
}

export interface PartnerPermissions {
  canViewProgress: boolean;
  canViewTasks: boolean;
  canSendNudges: boolean;
  canViewStreak: boolean;
  receivesAlerts: boolean;
}

export interface Nudge {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  type: 'encouragement' | 'reminder' | 'celebration';
  createdAt: Date;
  readAt?: Date;
}

// ==========================================
// CONTEXT ENGINE
// ==========================================

export interface UserContext {
  userId: string;
  timestamp: Date;

  // Domain context (for multi-life management)
  currentDomainId?: string;
  currentDomainType?: 'client' | 'property' | 'job' | 'personal' | 'family';
  currentProjectId?: string;

  // Location
  location?: 'home' | 'work' | 'transit' | 'errand' | 'other';

  // Time
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;

  // Energy & Mood
  energyLevel?: EnergyLevel;
  mood?: 'focused' | 'scattered' | 'creative' | 'tired' | 'anxious' | 'motivated';

  // Available time
  availableMinutes?: number;

  // Current activity
  isInFocusMode: boolean;
  currentTaskId?: string;
}

export interface SmartSuggestion {
  taskId: string;
  score: number;
  reasons: string[];
}

// ==========================================
// NOTIFICATIONS & REMINDERS
// ==========================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduledFor: Date;
  sentAt?: Date;
  readAt?: Date;
  actionTaken?: string;
}

export type NotificationType =
  | 'task_reminder'
  | 'chain_trigger'
  | 'time_anchor'
  | 'streak_warning'
  | 'achievement_unlocked'
  | 'quest_progress'
  | 'partner_nudge'
  | 'recovery_check_in'
  | 'daily_summary';

// ==========================================
// APP STATE
// ==========================================

export interface AppState {
  user: User | null;
  tasks: Task[];
  chains: MomentumChain[];
  streaks: Streak[];
  context: UserContext;
  timeAwareness: TimeAwareness;
  dailyQuest: DailyQuest | null;
  todayRating: DayRating | null;

  // UI State
  isLoading: boolean;
  activeView: 'today' | 'tasks' | 'chains' | 'stats' | 'settings';

  // Sync state
  lastSyncedAt: Date | null;
  pendingChanges: number;
}

// ==========================================
// LEVEL SYSTEM
// ==========================================

export interface LevelDefinition {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  perks: string[];
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: "Spark", minXP: 0, maxXP: 100, perks: [] },
  { level: 2, name: "Ember", minXP: 100, maxXP: 250, perks: ["Streak Shield x1"] },
  { level: 3, name: "Flame", minXP: 250, maxXP: 500, perks: ["Custom Chain Colors"] },
  { level: 4, name: "Fire", minXP: 500, maxXP: 1000, perks: ["Streak Shield x2"] },
  { level: 5, name: "Blaze", minXP: 1000, maxXP: 2000, perks: ["Daily Bonus XP"] },
  { level: 6, name: "Inferno", minXP: 2000, maxXP: 4000, perks: ["Streak Shield x3"] },
  { level: 7, name: "Phoenix", minXP: 4000, maxXP: 8000, perks: ["Recovery Boost"] },
  { level: 8, name: "Solar", minXP: 8000, maxXP: 16000, perks: ["Legendary Loot Chance Up"] },
  { level: 9, name: "Supernova", minXP: 16000, maxXP: 32000, perks: ["Unlimited Streak Shields"] },
  { level: 10, name: "Momentum Master", minXP: 32000, maxXP: Infinity, perks: ["Unlock Everything"] },
];

// ==========================================
// XP REWARDS
// ==========================================

export const XP_REWARDS = {
  // Task completion
  TASK_COMPLETE_BASE: 10,
  TASK_COMPLETE_HIGH_PRIORITY: 20,
  TASK_COMPLETE_CRITICAL: 50,

  // Chains
  CHAIN_LINK_COMPLETE: 5,
  CHAIN_FULL_COMPLETE: 50,

  // Streaks
  STREAK_DAY_BONUS: 5,
  STREAK_WEEK_BONUS: 100,

  // Time-based
  EARLY_BIRD_BONUS: 25, // complete task before 9am
  NIGHT_OWL_BONUS: 25, // complete task after 10pm
  DEADLINE_BEAT_BONUS: 15, // complete before due date

  // Quests
  DAILY_QUEST_COMPLETE: 30,
  ALL_QUESTS_COMPLETE: 100,

  // Recovery
  RECOVERY_COMPLETE: 75,

  // Random bonus range
  LOOT_DROP_MIN: 5,
  LOOT_DROP_MAX: 100,
} as const;

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULTS = {
  TASK_DURATION_MINUTES: 25,
  TRANSITION_PADDING_MINUTES: 15,
  STREAK_SHIELD_COUNT: 1,
  MAX_VISIBLE_STREAK: 7,
  LOOT_DROP_CHANCE: 0.15, // 15% chance per task
  RARE_LOOT_CHANCE: 0.05,
  EPIC_LOOT_CHANCE: 0.01,
  LEGENDARY_LOOT_CHANCE: 0.001,
} as const;

// ==========================================
// DOMAINS & PROJECTS
// ==========================================

export * from './domains';

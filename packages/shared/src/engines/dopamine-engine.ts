// ============================================
// DOPAMINE ENGINE
// Gamification that actually works for ADHD
// Variable rewards, XP, levels, achievements
// ============================================

import { v4 as uuid } from 'uuid';
import {
  Task,
  UserStats,
  XPEvent,
  Achievement,
  UserAchievement,
  DailyQuest,
  Quest,
  LootDrop,
  Streak,
  LEVELS,
  XP_REWARDS,
  DEFAULTS,
  LevelDefinition,
} from '../types';

// ==========================================
// XP SYSTEM
// ==========================================

export interface XPReward {
  base: number;
  bonuses: { reason: string; amount: number }[];
  total: number;
  triggeredLootDrop?: LootDrop;
  levelUp?: { from: number; to: number };
}

/**
 * Calculate XP reward for completing a task
 * Includes variable bonuses to trigger dopamine
 */
export function calculateTaskXP(
  task: Task,
  stats: UserStats,
  streak: Streak | null
): XPReward {
  const bonuses: { reason: string; amount: number }[] = [];
  let base = task.baseXP;

  // Time-based bonuses
  const hour = new Date().getHours();
  if (hour < 9 && hour >= 5) {
    bonuses.push({ reason: 'Early bird! 🌅', amount: XP_REWARDS.EARLY_BIRD_BONUS });
  }
  if (hour >= 22 || hour < 5) {
    bonuses.push({ reason: 'Night owl! 🦉', amount: XP_REWARDS.NIGHT_OWL_BONUS });
  }

  // Deadline bonus
  if (task.dueDate && task.completedAt) {
    const hoursEarly = (task.dueDate.getTime() - task.completedAt.getTime()) / (1000 * 60 * 60);
    if (hoursEarly > 24) {
      bonuses.push({ reason: 'Ahead of schedule! ⚡', amount: XP_REWARDS.DEADLINE_BEAT_BONUS });
    }
  }

  // Streak bonus
  if (streak && streak.currentCount > 0) {
    const streakBonus = Math.min(streak.currentCount, 7) * XP_REWARDS.STREAK_DAY_BONUS;
    bonuses.push({ reason: `${streak.currentCount}-day streak! 🔥`, amount: streakBonus });
  }

  // Priority bonus
  if (task.priority === 'critical') {
    bonuses.push({ reason: 'Critical task done! 💪', amount: 10 });
  }

  // Quick task bonus (under estimated time)
  if (task.actualMinutes && task.estimatedMinutes && task.actualMinutes < task.estimatedMinutes) {
    bonuses.push({ reason: 'Speed bonus! ⚡', amount: 5 });
  }

  // Random variable bonus (slot machine effect)
  const randomBonus = getRandomBonus();
  if (randomBonus > 0) {
    bonuses.push({ reason: 'Lucky bonus! 🎰', amount: randomBonus });
  }

  const total = base + bonuses.reduce((sum, b) => sum + b.amount, 0);

  // Check for loot drop
  const triggeredLootDrop = rollForLootDrop(task, stats);

  // Check for level up
  const currentLevel = getLevelFromXP(stats.totalXP);
  const newLevel = getLevelFromXP(stats.totalXP + total);
  const levelUp = newLevel.level > currentLevel.level
    ? { from: currentLevel.level, to: newLevel.level }
    : undefined;

  return {
    base,
    bonuses,
    total,
    triggeredLootDrop,
    levelUp,
  };
}

/**
 * Variable ratio reinforcement - like a slot machine
 * Sometimes you get extra, sometimes you don't
 */
function getRandomBonus(): number {
  const roll = Math.random();

  if (roll < 0.05) return 50;  // 5% chance of big bonus
  if (roll < 0.15) return 25;  // 10% chance of medium bonus
  if (roll < 0.30) return 10;  // 15% chance of small bonus
  return 0;                     // 70% no bonus
}

// ==========================================
// LEVEL SYSTEM
// ==========================================

export function getLevelFromXP(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  progressPercent: number;
  xpToNext: number;
} {
  const currentLevel = getLevelFromXP(xp);
  const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentLevelIndex < LEVELS.length - 1
    ? LEVELS[currentLevelIndex + 1]
    : null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      xpToNext: 0,
    };
  }

  const xpInLevel = xp - currentLevel.minXP;
  const xpNeededForLevel = nextLevel.minXP - currentLevel.minXP;
  const progressPercent = Math.round((xpInLevel / xpNeededForLevel) * 100);
  const xpToNext = nextLevel.minXP - xp;

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    xpToNext,
  };
}

// ==========================================
// LOOT DROP SYSTEM
// ==========================================

export function rollForLootDrop(task: Task, stats: UserStats): LootDrop | null {
  const roll = Math.random();

  // Base chance modified by level
  const levelBonus = stats.level * 0.01; // +1% per level
  const dropChance = DEFAULTS.LOOT_DROP_CHANCE + levelBonus;

  if (roll > dropChance) return null;

  // Determine rarity
  const rarityRoll = Math.random();
  let rarity: LootDrop['rarity'];
  let value: number | string;
  let type: LootDrop['type'];

  if (rarityRoll < DEFAULTS.LEGENDARY_LOOT_CHANCE) {
    rarity = 'legendary';
    type = Math.random() < 0.5 ? 'streak_shield' : 'xp_bonus';
    value = type === 'xp_bonus' ? 100 : 3; // 3 streak shields
  } else if (rarityRoll < DEFAULTS.EPIC_LOOT_CHANCE) {
    rarity = 'epic';
    type = Math.random() < 0.5 ? 'streak_shield' : 'xp_bonus';
    value = type === 'xp_bonus' ? 75 : 2;
  } else if (rarityRoll < DEFAULTS.RARE_LOOT_CHANCE) {
    rarity = 'rare';
    type = 'xp_bonus';
    value = 50;
  } else if (rarityRoll < 0.3) {
    rarity = 'uncommon';
    type = 'xp_bonus';
    value = 25;
  } else {
    rarity = 'common';
    type = 'xp_bonus';
    value = 10;
  }

  return {
    id: uuid(),
    userId: task.userId,
    type,
    value,
    taskId: task.id,
    claimedAt: new Date(),
    rarity,
  };
}

// ==========================================
// STREAK SYSTEM (with shields)
// ==========================================

export function updateStreak(
  streak: Streak,
  tasksCompletedToday: number,
  minimumForStreak: number = 1
): Streak {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(streak.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysSinceActivity = Math.floor(
    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Same day - just update the date
  if (daysSinceActivity === 0) {
    if (tasksCompletedToday >= minimumForStreak) {
      return {
        ...streak,
        lastActivityDate: new Date(),
      };
    }
    return streak;
  }

  // Next day - extend streak
  if (daysSinceActivity === 1 && tasksCompletedToday >= minimumForStreak) {
    const newCount = streak.currentCount + 1;
    return {
      ...streak,
      currentCount: newCount,
      longestCount: Math.max(newCount, streak.longestCount),
      lastActivityDate: new Date(),
    };
  }

  // Missed days - check for shields
  if (daysSinceActivity > 1) {
    const daysMissed = daysSinceActivity - 1;

    if (streak.shieldsAvailable >= daysMissed) {
      // Use shields to protect streak
      return {
        ...streak,
        shieldsAvailable: streak.shieldsAvailable - daysMissed,
        shieldsUsed: streak.shieldsUsed + daysMissed,
        currentCount: streak.currentCount + 1,
        longestCount: Math.max(streak.currentCount + 1, streak.longestCount),
        lastActivityDate: new Date(),
      };
    }

    // Streak broken - reset
    return {
      ...streak,
      currentCount: tasksCompletedToday >= minimumForStreak ? 1 : 0,
      lastActivityDate: new Date(),
      startedAt: new Date(),
    };
  }

  return streak;
}

export function addStreakShield(streak: Streak, count: number = 1): Streak {
  return {
    ...streak,
    shieldsAvailable: streak.shieldsAvailable + count,
  };
}

/**
 * Get visible streak (max 7 to prevent devastating losses)
 */
export function getVisibleStreak(streak: Streak): number {
  return Math.min(streak.currentCount, DEFAULTS.MAX_VISIBLE_STREAK);
}

// ==========================================
// DAILY QUESTS
// ==========================================

export function generateDailyQuests(userId: string, stats: UserStats): DailyQuest {
  const quests: Quest[] = [
    // Always have a "complete tasks" quest
    {
      id: uuid(),
      title: 'Task Tackler',
      description: 'Complete any 3 tasks today',
      type: 'complete_tasks',
      target: 3,
      current: 0,
      xpReward: 30,
      completed: false,
    },
    // XP quest scales with level
    {
      id: uuid(),
      title: 'XP Hunter',
      description: `Earn ${50 + stats.level * 10} XP today`,
      type: 'earn_xp',
      target: 50 + stats.level * 10,
      current: 0,
      xpReward: 40,
      completed: false,
    },
  ];

  // Add streak quest if they have an active streak
  if (stats.currentStreak > 0) {
    quests.push({
      id: uuid(),
      title: 'Streak Keeper',
      description: 'Complete at least 1 task to maintain your streak',
      type: 'maintain_streak',
      target: 1,
      current: 0,
      xpReward: 25,
      completed: false,
    });
  }

  // Random bonus quest
  const bonusQuests: Omit<Quest, 'id'>[] = [
    {
      title: 'Chain Reaction',
      description: 'Complete a full momentum chain',
      type: 'chain_completion',
      target: 1,
      current: 0,
      xpReward: 50,
      completed: false,
    },
    {
      title: 'Focus Master',
      description: 'Spend 30 minutes in focus mode',
      type: 'focus_time',
      target: 30,
      current: 0,
      xpReward: 35,
      completed: false,
    },
  ];

  const randomQuest = bonusQuests[Math.floor(Math.random() * bonusQuests.length)];
  quests.push({ ...randomQuest, id: uuid() });

  return {
    id: uuid(),
    userId,
    date: new Date(),
    quests,
    completed: 0,
    total: quests.length,
  };
}

export function updateQuestProgress(
  dailyQuest: DailyQuest,
  questType: Quest['type'],
  progress: number
): DailyQuest {
  const updatedQuests = dailyQuest.quests.map(quest => {
    if (quest.type !== questType || quest.completed) return quest;

    const newCurrent = quest.current + progress;
    const completed = newCurrent >= quest.target;

    return {
      ...quest,
      current: newCurrent,
      completed,
    };
  });

  const completedCount = updatedQuests.filter(q => q.completed).length;

  return {
    ...dailyQuest,
    quests: updatedQuests,
    completed: completedCount,
  };
}

export function getQuestRewards(dailyQuest: DailyQuest): number {
  const questXP = dailyQuest.quests
    .filter(q => q.completed)
    .reduce((sum, q) => sum + q.xpReward, 0);

  // Bonus for completing all quests
  const allComplete = dailyQuest.completed === dailyQuest.total;
  const bonusXP = allComplete ? XP_REWARDS.ALL_QUESTS_COMPLETE : 0;

  return questXP + bonusXP;
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export const ACHIEVEMENTS: Achievement[] = [
  // Getting started
  {
    id: 'first_task',
    name: 'First Step',
    description: 'Complete your first task',
    icon: '👣',
    xpReward: 25,
    rarity: 'common',
    condition: { type: 'tasks_completed', threshold: 1 },
    isHidden: false,
  },
  {
    id: 'ten_tasks',
    name: 'Getting Momentum',
    description: 'Complete 10 tasks',
    icon: '🚀',
    xpReward: 50,
    rarity: 'common',
    condition: { type: 'tasks_completed', threshold: 10 },
    isHidden: false,
  },
  {
    id: 'hundred_tasks',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '💯',
    xpReward: 200,
    rarity: 'rare',
    condition: { type: 'tasks_completed', threshold: 100 },
    isHidden: false,
  },
  {
    id: 'thousand_tasks',
    name: 'Task Titan',
    description: 'Complete 1,000 tasks',
    icon: '🏆',
    xpReward: 1000,
    rarity: 'legendary',
    condition: { type: 'tasks_completed', threshold: 1000 },
    isHidden: true,
  },

  // Streaks
  {
    id: 'streak_3',
    name: 'Getting Consistent',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    xpReward: 30,
    rarity: 'common',
    condition: { type: 'streak', threshold: 3 },
    isHidden: false,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: '🌟',
    xpReward: 100,
    rarity: 'uncommon',
    condition: { type: 'streak', threshold: 7 },
    isHidden: false,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Reach a 30-day streak',
    icon: '👑',
    xpReward: 500,
    rarity: 'epic',
    condition: { type: 'streak', threshold: 30 },
    isHidden: false,
  },
  {
    id: 'streak_100',
    name: 'Unstoppable',
    description: 'Reach a 100-day streak',
    icon: '🌋',
    xpReward: 2000,
    rarity: 'legendary',
    condition: { type: 'streak', threshold: 100 },
    isHidden: true,
  },

  // Recovery (ADHD-specific)
  {
    id: 'bounce_back',
    name: 'Bounce Back',
    description: 'Complete a task after missing a day',
    icon: '🦘',
    xpReward: 50,
    rarity: 'uncommon',
    condition: { type: 'recovery', threshold: 1 },
    isHidden: false,
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Recover from 5 zero days',
    icon: '🐦‍🔥',
    xpReward: 150,
    rarity: 'rare',
    condition: { type: 'recovery', threshold: 5 },
    isHidden: false,
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Recover from 20 zero days',
    icon: '💎',
    xpReward: 500,
    rarity: 'epic',
    condition: { type: 'recovery', threshold: 20 },
    isHidden: true,
  },

  // Time-based
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 tasks before 9 AM',
    icon: '🌅',
    xpReward: 75,
    rarity: 'uncommon',
    condition: { type: 'early_bird', threshold: 10 },
    isHidden: false,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 tasks after 10 PM',
    icon: '🦉',
    xpReward: 75,
    rarity: 'uncommon',
    condition: { type: 'night_owl', threshold: 10 },
    isHidden: false,
  },

  // Chains
  {
    id: 'chain_starter',
    name: 'Chain Starter',
    description: 'Complete your first momentum chain',
    icon: '⛓️',
    xpReward: 40,
    rarity: 'common',
    condition: { type: 'chains_completed', threshold: 1 },
    isHidden: false,
  },
  {
    id: 'chain_master',
    name: 'Chain Master',
    description: 'Complete 50 momentum chains',
    icon: '🔗',
    xpReward: 300,
    rarity: 'rare',
    condition: { type: 'chains_completed', threshold: 50 },
    isHidden: false,
  },

  // Perfect days
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Complete all planned tasks in a day',
    icon: '✨',
    xpReward: 100,
    rarity: 'uncommon',
    condition: { type: 'perfect_days', threshold: 1 },
    isHidden: false,
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Have 7 perfect days',
    icon: '🌈',
    xpReward: 500,
    rarity: 'epic',
    condition: { type: 'perfect_days', threshold: 7 },
    isHidden: false,
  },
];

export function checkForNewAchievements(
  stats: UserStats,
  existingAchievements: UserAchievement[]
): Achievement[] {
  const unlockedIds = new Set(existingAchievements.map(a => a.achievementId));
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    const unlocked = checkAchievementCondition(achievement, stats);
    if (unlocked) {
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

function checkAchievementCondition(achievement: Achievement, stats: UserStats): boolean {
  const { type, threshold } = achievement.condition;

  switch (type) {
    case 'tasks_completed':
      return stats.totalTasksCompleted >= threshold;
    case 'streak':
      return stats.longestStreak >= threshold;
    case 'chains_completed':
      return stats.totalMomentumChains >= threshold;
    case 'perfect_days':
      return stats.perfectDays >= threshold;
    case 'xp_earned':
      return stats.totalXP >= threshold;
    default:
      return false;
  }
}

export function createUserAchievement(userId: string, achievement: Achievement): UserAchievement {
  return {
    id: uuid(),
    odajId: userId,
    achievementId: achievement.id,
    unlockedAt: new Date(),
    celebrated: false,
  };
}

// ==========================================
// CELEBRATION MESSAGES
// ==========================================

export function getCelebrationMessage(type: 'task' | 'chain' | 'quest' | 'level' | 'achievement'): string {
  const messages = {
    task: [
      'Boom! Done! 💥',
      'Crushed it! 🎯',
      'Another one bites the dust! 🎸',
      'You\'re on fire! 🔥',
      'Keep that momentum! 🚀',
      'Easy money! 💰',
      'Unstoppable! ⚡',
      'Like a boss! 😎',
    ],
    chain: [
      'Chain complete! You\'re building momentum! ⛓️',
      'Full chain! That dopamine hit tho! 🧠',
      'Momentum chain conquered! 🏆',
      'You just crushed that chain! 💪',
    ],
    quest: [
      'Quest complete! Bonus XP incoming! 🎮',
      'Daily quest done! You\'re leveling up! 📈',
      'Quest conquered! Keep hunting! 🎯',
    ],
    level: [
      'LEVEL UP! New powers unlocked! 🆙',
      'You just evolved! 🦋',
      'New level achieved! You\'re ascending! 🌟',
    ],
    achievement: [
      'Achievement unlocked! You earned this! 🏅',
      'New badge! You\'re collecting wins! 🎖️',
      'Achievement get! The grind pays off! 🏆',
    ],
  };

  const typeMessages = messages[type];
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

// ==========================================
// XP EVENT CREATION
// ==========================================

export function createXPEvent(
  userId: string,
  amount: number,
  reason: string,
  taskId?: string,
  isBonus: boolean = false
): XPEvent {
  return {
    id: uuid(),
    userId,
    amount,
    reason,
    taskId,
    timestamp: new Date(),
    isBonus,
  };
}

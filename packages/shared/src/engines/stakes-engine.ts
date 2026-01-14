// ============================================
// STAKES ENGINE
// External accountability when internal motivation fails
// Making commitments stick
// ============================================

import { v4 as uuid } from 'uuid';
import {
  Commitment,
  Stake,
  AccountabilityPartner,
  PartnerPermissions,
  Nudge,
} from '../types';
import { differenceInHours, differenceInDays } from 'date-fns';

// ==========================================
// COMMITMENTS
// ==========================================

export interface CreateCommitmentInput {
  description: string;
  deadline: Date;
  stakeType: 'money' | 'social' | 'reputation';
  stakeAmount?: number;
  stakeRecipient?: string;
  visibility?: 'private' | 'partners' | 'public';
}

/**
 * Create a commitment with stakes
 */
export function createCommitment(
  userId: string,
  input: CreateCommitmentInput
): Commitment {
  const stake: Stake = {
    type: input.stakeType,
    amount: input.stakeAmount,
    recipient: input.stakeRecipient,
    visibility: input.visibility || 'private',
  };

  return {
    id: uuid(),
    userId,
    description: input.description,
    deadline: input.deadline,
    stake,
    status: 'active',
    createdAt: new Date(),
  };
}

/**
 * Complete a commitment successfully
 */
export function completeCommitment(commitment: Commitment): Commitment {
  return {
    ...commitment,
    status: 'completed',
    completedAt: new Date(),
  };
}

/**
 * Fail a commitment (past deadline)
 */
export function failCommitment(commitment: Commitment): Commitment {
  return {
    ...commitment,
    status: 'failed',
  };
}

/**
 * Check if commitment is at risk
 */
export function checkCommitmentStatus(commitment: Commitment): {
  status: 'safe' | 'warning' | 'danger' | 'overdue';
  message: string;
  hoursRemaining: number;
} {
  if (commitment.status !== 'active') {
    return {
      status: 'safe',
      message: `Commitment ${commitment.status}`,
      hoursRemaining: 0,
    };
  }

  const now = new Date();
  const hoursRemaining = differenceInHours(commitment.deadline, now);

  if (hoursRemaining < 0) {
    return {
      status: 'overdue',
      message: `Overdue by ${Math.abs(hoursRemaining)} hours!`,
      hoursRemaining,
    };
  }

  if (hoursRemaining < 24) {
    return {
      status: 'danger',
      message: `Only ${hoursRemaining} hours left!`,
      hoursRemaining,
    };
  }

  if (hoursRemaining < 72) {
    return {
      status: 'warning',
      message: `${Math.round(hoursRemaining / 24)} days remaining`,
      hoursRemaining,
    };
  }

  return {
    status: 'safe',
    message: `${Math.round(hoursRemaining / 24)} days to complete`,
    hoursRemaining,
  };
}

// ==========================================
// STAKE TYPES
// ==========================================

/**
 * Money stake - Beeminder style
 */
export interface MoneyStakeConfig {
  amount: number;
  recipient: 'charity' | 'anti_charity' | 'friend';
  charityName?: string;
  friendEmail?: string;
}

export function createMoneyStake(config: MoneyStakeConfig): Stake {
  return {
    type: 'money',
    amount: config.amount,
    recipient: config.recipient === 'charity'
      ? config.charityName || 'Charity of choice'
      : config.recipient === 'friend'
        ? config.friendEmail
        : 'Anti-charity',
    visibility: 'private',
  };
}

/**
 * Social stake - public commitment
 */
export interface SocialStakeConfig {
  platform: 'twitter' | 'facebook' | 'partners';
  message: string;
  includeProgress: boolean;
}

export function createSocialStake(config: SocialStakeConfig): Stake {
  return {
    type: 'social',
    visibility: config.platform === 'partners' ? 'partners' : 'public',
  };
}

/**
 * Reputation stake - accountability partners see your progress
 */
export function createReputationStake(): Stake {
  return {
    type: 'reputation',
    visibility: 'partners',
  };
}

// ==========================================
// ACCOUNTABILITY PARTNERS
// ==========================================

/**
 * Add an accountability partner
 */
export function addAccountabilityPartner(
  userId: string,
  partnerUserId: string,
  partnerName: string,
  relationship: AccountabilityPartner['relationship'],
  permissions: Partial<PartnerPermissions> = {}
): AccountabilityPartner {
  const defaultPermissions: PartnerPermissions = {
    canViewProgress: true,
    canViewTasks: false,
    canSendNudges: true,
    canViewStreak: true,
    receivesAlerts: false,
  };

  return {
    id: uuid(),
    userId,
    partnerUserId,
    partnerName,
    relationship,
    permissions: { ...defaultPermissions, ...permissions },
    createdAt: new Date(),
  };
}

/**
 * Update partner permissions
 */
export function updatePartnerPermissions(
  partner: AccountabilityPartner,
  permissions: Partial<PartnerPermissions>
): AccountabilityPartner {
  return {
    ...partner,
    permissions: { ...partner.permissions, ...permissions },
  };
}

// ==========================================
// NUDGES
// ==========================================

/**
 * Send a nudge to a user
 */
export function createNudge(
  fromUserId: string,
  toUserId: string,
  message: string,
  type: Nudge['type']
): Nudge {
  return {
    id: uuid(),
    fromUserId,
    toUserId,
    message,
    type,
    createdAt: new Date(),
  };
}

/**
 * Mark nudge as read
 */
export function readNudge(nudge: Nudge): Nudge {
  return {
    ...nudge,
    readAt: new Date(),
  };
}

/**
 * Generate smart nudge suggestions
 */
export function suggestNudge(
  streakCount: number,
  daysSinceActivity: number,
  tasksCompletedToday: number
): { type: Nudge['type']; message: string } | null {
  // Celebration nudges
  if (streakCount === 7) {
    return {
      type: 'celebration',
      message: 'One week streak! You\'re building real momentum! 🎉',
    };
  }

  if (tasksCompletedToday >= 5) {
    return {
      type: 'celebration',
      message: 'Crushing it today! 5 tasks done! 💪',
    };
  }

  // Encouragement nudges
  if (daysSinceActivity === 1) {
    return {
      type: 'reminder',
      message: 'Hey! Your streak is waiting. Even one small task counts! 🔥',
    };
  }

  if (daysSinceActivity >= 3) {
    return {
      type: 'encouragement',
      message: 'Missing you! No pressure, but your system is ready when you are. 💙',
    };
  }

  return null;
}

// ==========================================
// BODY DOUBLING
// ==========================================

export interface BodyDoubleSession {
  id: string;
  hostUserId: string;
  participantUserIds: string[];
  startTime: Date;
  endTime?: Date;
  focusTopic: string;
  isActive: boolean;
}

/**
 * Create a body double session
 * Virtual co-working for ADHD brains
 */
export function createBodyDoubleSession(
  hostUserId: string,
  focusTopic: string,
  durationMinutes: number = 50
): BodyDoubleSession {
  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);

  return {
    id: uuid(),
    hostUserId,
    participantUserIds: [hostUserId],
    startTime: new Date(),
    endTime,
    focusTopic,
    isActive: true,
  };
}

/**
 * Join a body double session
 */
export function joinBodyDoubleSession(
  session: BodyDoubleSession,
  userId: string
): BodyDoubleSession {
  if (session.participantUserIds.includes(userId)) {
    return session;
  }

  return {
    ...session,
    participantUserIds: [...session.participantUserIds, userId],
  };
}

/**
 * End a body double session
 */
export function endBodyDoubleSession(session: BodyDoubleSession): BodyDoubleSession {
  return {
    ...session,
    isActive: false,
    endTime: new Date(),
  };
}

// ==========================================
// COMMITMENT TEMPLATES
// ==========================================

export const COMMITMENT_TEMPLATES = [
  {
    name: 'Daily Task Minimum',
    description: 'Complete at least {count} tasks every day this week',
    defaultDeadline: 7, // days
    suggestedStake: 'reputation',
  },
  {
    name: 'Project Deadline',
    description: 'Finish {project} by {date}',
    defaultDeadline: 14,
    suggestedStake: 'money',
  },
  {
    name: 'Habit Streak',
    description: 'Maintain {habit} streak for {days} days',
    defaultDeadline: 7,
    suggestedStake: 'social',
  },
  {
    name: 'Morning Routine',
    description: 'Complete morning routine before {time} for {days} days',
    defaultDeadline: 7,
    suggestedStake: 'reputation',
  },
  {
    name: 'Weekly Goal',
    description: 'Accomplish {goal} by end of week',
    defaultDeadline: 7,
    suggestedStake: 'money',
  },
];

// ==========================================
// PROGRESS SHARING
// ==========================================

export interface ProgressUpdate {
  id: string;
  userId: string;
  type: 'daily_summary' | 'streak_milestone' | 'achievement' | 'commitment';
  content: string;
  timestamp: Date;
  visibility: 'private' | 'partners' | 'public';
  reactions: { userId: string; emoji: string }[];
}

/**
 * Generate shareable progress update
 */
export function generateProgressUpdate(
  userId: string,
  type: ProgressUpdate['type'],
  data: {
    tasksCompleted?: number;
    streakCount?: number;
    achievementName?: string;
    commitmentDescription?: string;
  },
  visibility: ProgressUpdate['visibility'] = 'partners'
): ProgressUpdate {
  let content: string;

  switch (type) {
    case 'daily_summary':
      content = `Completed ${data.tasksCompleted || 0} tasks today! 💪`;
      break;
    case 'streak_milestone':
      content = `${data.streakCount}-day streak! The momentum is real! 🔥`;
      break;
    case 'achievement':
      content = `Unlocked: ${data.achievementName}! 🏆`;
      break;
    case 'commitment':
      content = `Committed to: ${data.commitmentDescription} 📝`;
      break;
    default:
      content = 'Made progress today!';
  }

  return {
    id: uuid(),
    userId,
    type,
    content,
    timestamp: new Date(),
    visibility,
    reactions: [],
  };
}

/**
 * Add reaction to progress update
 */
export function addReaction(
  update: ProgressUpdate,
  userId: string,
  emoji: string
): ProgressUpdate {
  const existingIndex = update.reactions.findIndex(r => r.userId === userId);

  if (existingIndex >= 0) {
    // Update existing reaction
    const newReactions = [...update.reactions];
    newReactions[existingIndex] = { userId, emoji };
    return { ...update, reactions: newReactions };
  }

  // Add new reaction
  return {
    ...update,
    reactions: [...update.reactions, { userId, emoji }],
  };
}

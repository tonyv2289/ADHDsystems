// ============================================
// SLACK INTEGRATION SERVICE
// Send summaries and receive tasks via Slack
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// TYPES
// ==========================================

export interface SlackConfig {
  webhookUrl: string; // Incoming webhook URL
  channelName?: string;
  isEnabled: boolean;
}

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'context';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
}

interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
}

// ==========================================
// CONFIGURATION
// ==========================================

const SLACK_CONFIG_KEY = 'slack_config';

export async function saveSlackConfig(config: SlackConfig): Promise<void> {
  await AsyncStorage.setItem(SLACK_CONFIG_KEY, JSON.stringify(config));
}

export async function getSlackConfig(): Promise<SlackConfig | null> {
  const stored = await AsyncStorage.getItem(SLACK_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function clearSlackConfig(): Promise<void> {
  await AsyncStorage.removeItem(SLACK_CONFIG_KEY);
}

// ==========================================
// SENDING MESSAGES
// ==========================================

export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const config = await getSlackConfig();

  if (!config || !config.isEnabled || !config.webhookUrl) {
    console.log('Slack not configured or disabled');
    return false;
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return false;
  }
}

// ==========================================
// PRE-BUILT MESSAGES
// ==========================================

export async function sendDailySummary(data: {
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  xpEarned: number;
  currentStreak: number;
  bigThree: Array<{ title: string; completed: boolean }>;
}): Promise<boolean> {
  const completionRate = data.tasksTotal > 0
    ? Math.round((data.tasksCompleted / data.tasksTotal) * 100)
    : 0;

  const habitRate = data.habitsTotal > 0
    ? Math.round((data.habitsCompleted / data.habitsTotal) * 100)
    : 0;

  const bigThreeStatus = data.bigThree
    .map(t => `${t.completed ? '✅' : '⬜'} ${t.title}`)
    .join('\n');

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Daily Progress Summary',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Tasks Completed*\n${data.tasksCompleted}/${data.tasksTotal} (${completionRate}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Habits*\n${data.habitsCompleted}/${data.habitsTotal} (${habitRate}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*XP Earned*\n+${data.xpEarned} XP`,
          },
          {
            type: 'mrkdwn',
            text: `*Current Streak*\n🔥 ${data.currentStreak} days`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Big 3 Today:*\n${bigThreeStatus || 'No Big 3 set'}`,
        },
      },
    ],
  };

  return sendSlackMessage(message);
}

export async function sendTaskAdded(taskTitle: string, priority: string): Promise<boolean> {
  const priorityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    someday: '⚪',
  };

  const message: SlackMessage = {
    text: `${priorityEmoji[priority] || '📝'} New task added: *${taskTitle}*`,
  };

  return sendSlackMessage(message);
}

export async function sendTaskCompleted(
  taskTitle: string,
  xpEarned: number
): Promise<boolean> {
  const message: SlackMessage = {
    text: `✅ Task completed: *${taskTitle}* (+${xpEarned} XP)`,
  };

  return sendSlackMessage(message);
}

export async function sendStreakMilestone(
  streakDays: number
): Promise<boolean> {
  const message: SlackMessage = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔥🎉 *Streak Milestone!* 🎉🔥\n\nYou've maintained a *${streakDays}-day streak!* Keep the momentum going!`,
        },
      },
    ],
  };

  return sendSlackMessage(message);
}

export async function sendLevelUp(
  newLevel: number,
  levelName: string
): Promise<boolean> {
  const message: SlackMessage = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⬆️ *LEVEL UP!*\n\nYou've reached *Level ${newLevel}: ${levelName}*! 🎮`,
        },
      },
    ],
  };

  return sendSlackMessage(message);
}

export async function sendMorningBriefing(data: {
  bigThree: Array<{ title: string; priority: string }>;
  habitsToday: string[];
  overdueCount: number;
}): Promise<boolean> {
  const bigThreeList = data.bigThree
    .map((t, i) => `${i + 1}. ${t.title}`)
    .join('\n');

  const habitsList = data.habitsToday.join(', ') || 'None scheduled';

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🌅 Good Morning! Here\'s your day:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Your Big 3:*\n${bigThreeList || 'Not set yet - open the app to plan!'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Habits Today:* ${habitsList}`,
        },
      },
      ...(data.overdueCount > 0
        ? [
            {
              type: 'section' as const,
              text: {
                type: 'mrkdwn' as const,
                text: `⚠️ *${data.overdueCount} overdue task${data.overdueCount > 1 ? 's' : ''}* - let's tackle them!`,
              },
            },
          ]
        : []),
    ],
  };

  return sendSlackMessage(message);
}

// ==========================================
// WEBHOOK SETUP INSTRUCTIONS
// ==========================================

export const SLACK_SETUP_INSTRUCTIONS = `
## How to set up Slack Integration

1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Name it "Momentum" and select your workspace
4. Go to "Incoming Webhooks" in the sidebar
5. Toggle "Activate Incoming Webhooks" to ON
6. Click "Add New Webhook to Workspace"
7. Select the channel where you want notifications
8. Copy the Webhook URL and paste it in the app

That's it! You'll now receive updates in Slack.
`;

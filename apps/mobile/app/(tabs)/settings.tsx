// ============================================
// SETTINGS SCREEN
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import {
  requestNotificationPermissions,
  scheduleMorningBriefing,
  scheduleEveningReview,
  cancelAllNotifications,
} from '../../services/notifications';
import {
  getSlackConfig,
  saveSlackConfig,
  clearSlackConfig,
  sendDailySummary,
  SLACK_SETUP_INSTRUCTIONS,
} from '../../services/slack';
import {
  getCalendarConfig,
  clearCalendarConfig,
  CALENDAR_SETUP_INSTRUCTIONS,
} from '../../services/calendar';
import {
  pickCSVFile,
  importTasksFromCSV,
  importHabitsFromCSV,
  importClientsFromCSV,
  CSV_TEMPLATES,
} from '../../services/import';

export default function SettingsScreen() {
  const { settings, stats, tasks, habits } = useStore();

  // Integration states
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [slackConnected, setSlackConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Modal states
  const [slackModalVisible, setSlackModalVisible] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);

  useEffect(() => {
    checkIntegrations();
  }, []);

  async function checkIntegrations() {
    const slack = await getSlackConfig();
    setSlackConnected(!!slack?.isEnabled);

    const calendar = await getCalendarConfig();
    setCalendarConnected(!!calendar?.isEnabled);
  }

  // ==========================================
  // NOTIFICATION HANDLERS
  // ==========================================

  async function handleNotificationToggle(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setNotificationsEnabled(true);
        await scheduleMorningBriefing('08:00');
        await scheduleEveningReview('20:00');
        Alert.alert('Notifications Enabled', 'You\'ll receive morning briefings and evening reviews.');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    } else {
      setNotificationsEnabled(false);
      await cancelAllNotifications();
      Alert.alert('Notifications Disabled', 'All scheduled notifications have been cancelled.');
    }
  }

  // ==========================================
  // SLACK HANDLERS
  // ==========================================

  async function handleSlackConnect() {
    if (slackConnected) {
      Alert.alert(
        'Disconnect Slack',
        'Are you sure you want to disconnect Slack?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await clearSlackConfig();
              setSlackConnected(false);
            },
          },
        ]
      );
    } else {
      setSlackModalVisible(true);
    }
  }

  async function handleSlackSave() {
    if (!slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
      Alert.alert('Invalid URL', 'Please enter a valid Slack webhook URL.');
      return;
    }

    await saveSlackConfig({
      webhookUrl: slackWebhookUrl,
      isEnabled: true,
    });

    setSlackConnected(true);
    setSlackModalVisible(false);
    setSlackWebhookUrl('');

    // Test the connection
    const success = await sendDailySummary({
      tasksCompleted: stats.totalTasksCompleted,
      tasksTotal: tasks.length,
      habitsCompleted: habits.filter(h => h.completedToday).length,
      habitsTotal: habits.length,
      xpEarned: stats.totalXP,
      currentStreak: stats.currentStreak,
      bigThree: [],
    });

    if (success) {
      Alert.alert('Slack Connected!', 'Check your Slack channel for a test message.');
    } else {
      Alert.alert('Connection Failed', 'Could not send test message. Please check your webhook URL.');
    }
  }

  // ==========================================
  // CALENDAR HANDLERS
  // ==========================================

  async function handleCalendarConnect() {
    if (calendarConnected) {
      Alert.alert(
        'Disconnect Calendar',
        'Are you sure you want to disconnect Google Calendar?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await clearCalendarConfig();
              setCalendarConnected(false);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Google Calendar Setup',
        'Calendar integration requires setting up Google OAuth credentials. Check the docs for setup instructions.',
        [{ text: 'OK' }]
      );
    }
  }

  // ==========================================
  // IMPORT HANDLERS
  // ==========================================

  async function handleImport(type: 'tasks' | 'habits' | 'clients') {
    const csvContent = await pickCSVFile();
    if (!csvContent) return;

    let result;
    switch (type) {
      case 'tasks':
        result = await importTasksFromCSV(csvContent);
        break;
      case 'habits':
        result = await importHabitsFromCSV(csvContent);
        break;
      case 'clients':
        result = await importClientsFromCSV(csvContent);
        break;
    }

    if (result.success) {
      Alert.alert(
        'Import Complete',
        `Imported: ${result.imported}\nSkipped: ${result.skipped}${
          result.errors.length > 0 ? `\n\nErrors:\n${result.errors.slice(0, 3).join('\n')}` : ''
        }`
      );
      // TODO: Actually add the imported items to the store
    } else {
      Alert.alert('Import Failed', result.errors[0] || 'Unknown error');
    }

    setImportModalVisible(false);
  }

  // ==========================================
  // SETTINGS GROUPS
  // ==========================================

  const settingGroups = [
    {
      title: 'Notifications',
      items: [
        {
          key: 'notifications',
          label: 'Push Notifications',
          value: notificationsEnabled,
          type: 'switch',
          onToggle: handleNotificationToggle,
        },
        {
          key: 'quietHours',
          label: 'Quiet Hours',
          value: `${settings.quietHoursStart} - ${settings.quietHoursEnd}`,
          type: 'link',
        },
      ],
    },
    {
      title: 'Integrations',
      items: [
        {
          key: 'slack',
          label: 'Slack',
          value: slackConnected ? 'Connected' : 'Not connected',
          type: 'link',
          icon: 'logo-slack',
          onPress: handleSlackConnect,
        },
        {
          key: 'calendar',
          label: 'Google Calendar',
          value: calendarConnected ? 'Connected' : 'Not connected',
          type: 'link',
          icon: 'calendar',
          onPress: handleCalendarConnect,
        },
        {
          key: 'import',
          label: 'Import Data (CSV)',
          value: '',
          type: 'link',
          icon: 'cloud-upload',
          onPress: () => setImportModalVisible(true),
        },
      ],
    },
    {
      title: 'Gamification',
      items: [
        { key: 'showXP', label: 'Show XP', value: settings.showXP, type: 'switch' },
        { key: 'showLevel', label: 'Show Level', value: settings.showLevel, type: 'switch' },
        { key: 'streakShields', label: 'Streak Shields', value: settings.streakShieldsEnabled, type: 'switch' },
      ],
    },
    {
      title: 'Time',
      items: [
        { key: 'wakeTime', label: 'Wake Time', value: settings.wakeTime, type: 'link' },
        { key: 'sleepTime', label: 'Sleep Time', value: settings.sleepTime, type: 'link' },
        { key: 'transition', label: 'Transition Buffer', value: `${settings.transitionTimePadding} min`, type: 'link' },
      ],
    },
    {
      title: 'Account',
      items: [
        { key: 'profile', label: 'Profile', value: '', type: 'link' },
        { key: 'partners', label: 'Accountability Partners', value: '', type: 'link' },
        { key: 'export', label: 'Export Data', value: '', type: 'link' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>L{stats.level}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Momentum User</Text>
          <Text style={styles.profileStats}>
            {stats.totalXP.toLocaleString()} XP • {stats.totalTasksCompleted} tasks
          </Text>
        </View>
      </View>

      {settingGroups.map(group => (
        <View key={group.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.title}</Text>
          <View style={styles.settingsGroup}>
            {group.items.map((item, index) => (
              <Pressable
                key={item.key}
                style={[styles.settingItem, index < group.items.length - 1 && styles.settingBorder]}
                onPress={'onPress' in item ? item.onPress : undefined}
              >
                <View style={styles.settingLeft}>
                  {'icon' in item && (
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={Colors.text.secondary}
                      style={styles.settingIcon}
                    />
                  )}
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value as boolean}
                    onValueChange={'onToggle' in item ? item.onToggle : undefined}
                    trackColor={{ false: Colors.background.tertiary, true: Colors.primary[500] }}
                    thumbColor={Colors.text.primary}
                  />
                ) : (
                  <View style={styles.settingRight}>
                    <Text style={[
                      styles.settingValue,
                      item.value === 'Connected' && styles.settingValueConnected,
                    ]}>
                      {item.value}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.version}>Momentum v0.1.0</Text>
        <Text style={styles.tagline}>Built for brains that work differently</Text>
      </View>

      {/* Slack Modal */}
      <Modal
        visible={slackModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSlackModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connect Slack</Text>
            <Pressable onPress={() => setSlackModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalInstructions}>{SLACK_SETUP_INSTRUCTIONS}</Text>

            <Text style={styles.inputLabel}>Webhook URL</Text>
            <TextInput
              style={styles.input}
              value={slackWebhookUrl}
              onChangeText={setSlackWebhookUrl}
              placeholder="https://hooks.slack.com/services/..."
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable style={styles.saveButton} onPress={handleSlackSave}>
              <Text style={styles.saveButtonText}>Connect Slack</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Data</Text>
            <Pressable onPress={() => setImportModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Import data from CSV files. Select what you want to import:
            </Text>

            <Pressable style={styles.importOption} onPress={() => handleImport('tasks')}>
              <Ionicons name="checkbox-outline" size={24} color={Colors.primary[500]} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>Tasks</Text>
                <Text style={styles.importOptionDesc}>Import tasks with titles, priorities, due dates</Text>
              </View>
            </Pressable>

            <Pressable style={styles.importOption} onPress={() => handleImport('habits')}>
              <Ionicons name="repeat" size={24} color={Colors.success.default} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>Habits</Text>
                <Text style={styles.importOptionDesc}>Import habits with frequency, time of day</Text>
              </View>
            </Pressable>

            <Pressable style={styles.importOption} onPress={() => handleImport('clients')}>
              <Ionicons name="people" size={24} color={Colors.info.default} />
              <View style={styles.importOptionText}>
                <Text style={styles.importOptionTitle}>Clients</Text>
                <Text style={styles.importOptionDesc}>Import clients with contact info, rates</Text>
              </View>
            </Pressable>

            <View style={styles.templateSection}>
              <Text style={styles.templateTitle}>CSV Format Examples:</Text>
              <Text style={styles.templateCode}>{CSV_TEMPLATES.tasks.split('\n')[0]}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface.default,
    padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg, gap: Spacing.md
  },
  avatar: {
    width: 56, height: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { ...Typography.h4, color: Colors.text.primary },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.h4, color: Colors.text.primary },
  profileStats: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.text.tertiary, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  settingsGroup: { backgroundColor: Colors.surface.default, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md
  },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.background.tertiary },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: Spacing.sm },
  settingLabel: { ...Typography.body, color: Colors.text.primary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { ...Typography.body, color: Colors.text.tertiary },
  settingValueConnected: { color: Colors.success.default },
  footer: { alignItems: 'center', paddingVertical: Spacing.xl },
  version: { ...Typography.caption, color: Colors.text.tertiary },
  tagline: { ...Typography.caption, color: Colors.text.tertiary, fontStyle: 'italic', marginTop: 4 },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: Colors.background.primary },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.background.tertiary,
  },
  modalTitle: { ...Typography.h3, color: Colors.text.primary },
  modalContent: { padding: Spacing.md },
  modalDescription: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg },
  modalInstructions: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg, lineHeight: 22 },
  inputLabel: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surface.default, borderRadius: BorderRadius.md, padding: Spacing.md,
    ...Typography.body, color: Colors.text.primary, marginBottom: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary[500], padding: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: { ...Typography.label, color: Colors.text.primary },

  // Import modal
  importOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface.default, padding: Spacing.md, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  importOptionText: { flex: 1 },
  importOptionTitle: { ...Typography.body, color: Colors.text.primary, fontWeight: '600' },
  importOptionDesc: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  templateSection: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.surface.default, borderRadius: BorderRadius.md },
  templateTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.xs },
  templateCode: { ...Typography.caption, color: Colors.text.tertiary, fontFamily: 'monospace' },
});

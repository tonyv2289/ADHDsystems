// ============================================
// SETTINGS SCREEN
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function SettingsScreen() {
  const { settings, stats } = useStore();

  const settingGroups = [
    {
      title: 'Notifications',
      items: [
        { key: 'notifications', label: 'Push Notifications', value: settings.notificationsEnabled, type: 'switch' },
        { key: 'quietHours', label: 'Quiet Hours', value: `${settings.quietHoursStart} - ${settings.quietHoursEnd}`, type: 'link' },
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
              <View
                key={item.key}
                style={[styles.settingItem, index < group.items.length - 1 && styles.settingBorder]}
              >
                <Text style={styles.settingLabel}>{item.label}</Text>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value as boolean}
                    trackColor={{ false: Colors.background.tertiary, true: Colors.primary[500] }}
                    thumbColor={Colors.text.primary}
                  />
                ) : (
                  <View style={styles.settingRight}>
                    <Text style={styles.settingValue}>{item.value}</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.version}>Momentum v0.1.0</Text>
        <Text style={styles.tagline}>Built for brains that work differently</Text>
      </View>
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
  settingLabel: { ...Typography.body, color: Colors.text.primary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { ...Typography.body, color: Colors.text.tertiary },
  footer: { alignItems: 'center', paddingVertical: Spacing.xl },
  version: { ...Typography.caption, color: Colors.text.tertiary },
  tagline: { ...Typography.caption, color: Colors.text.tertiary, fontStyle: 'italic', marginTop: 4 },
});

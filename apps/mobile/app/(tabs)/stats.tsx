// ============================================
// STATS SCREEN
// Gamification stats and insights
// ============================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { XPBar, StreakBadge } from '../../components';
import { ACHIEVEMENTS } from '@momentum/shared';

export default function StatsScreen() {
  const { stats, achievements, getXPProgress } = useStore();
  const xpProgress = getXPProgress();

  const unlockedAchievements = achievements.map(ua =>
    ACHIEVEMENTS.find(a => a.id === ua.achievementId)
  ).filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* XP and Level */}
      <XPBar />

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <StreakBadge size="medium" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTasksCompleted}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.perfectDays}</Text>
          <Text style={styles.statLabel}>Perfect Days</Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <Text style={styles.sectionSubtitle}>
          {unlockedAchievements.length}/{ACHIEVEMENTS.filter(a => !a.isHidden).length} unlocked
        </Text>

        <View style={styles.achievementGrid}>
          {ACHIEVEMENTS.filter(a => !a.isHidden).slice(0, 8).map(achievement => {
            const isUnlocked = achievements.some(ua => ua.achievementId === achievement.id);
            return (
              <View
                key={achievement.id}
                style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}
              >
                <Text style={styles.achievementIcon}>
                  {isUnlocked ? achievement.icon : '🔒'}
                </Text>
                <Text style={[styles.achievementName, !isUnlocked && styles.textLocked]}>
                  {achievement.name}
                </Text>
                <Text style={styles.achievementXP}>+{achievement.xpReward} XP</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightCard}>
          <Ionicons name="sunny" size={24} color={Colors.warning.default} />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Most Productive</Text>
            <Text style={styles.insightText}>
              {stats.mostProductiveDay}s at {stats.mostProductiveHour}:00
            </Text>
          </View>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="flash" size={24} color={Colors.energy[Math.round(stats.averageEnergyLevel) as 1|2|3|4|5]} />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Average Energy</Text>
            <Text style={styles.insightText}>Level {stats.averageEnergyLevel.toFixed(1)}/5</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surface.default,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', ...Shadows.sm
  },
  statNumber: { ...Typography.h2, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 4 },
  section: { marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: Colors.text.primary },
  sectionSubtitle: { ...Typography.caption, color: Colors.text.tertiary, marginBottom: Spacing.md },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achievementCard: {
    width: '48%', backgroundColor: Colors.surface.default,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', ...Shadows.sm
  },
  achievementLocked: { opacity: 0.5 },
  achievementIcon: { fontSize: 32, marginBottom: Spacing.xs },
  achievementName: { ...Typography.label, color: Colors.text.primary, textAlign: 'center' },
  textLocked: { color: Colors.text.tertiary },
  achievementXP: { ...Typography.caption, color: Colors.xp, marginTop: 4 },
  insightCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface.default,
    padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.sm, gap: Spacing.md
  },
  insightContent: { flex: 1 },
  insightTitle: { ...Typography.label, color: Colors.text.primary },
  insightText: { ...Typography.caption, color: Colors.text.secondary },
});

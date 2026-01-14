// ============================================
// TODAY SCREEN
// The main daily view - your momentum dashboard
// Designed for quick wins and minimal overwhelm
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { TaskCard, XPBar, StreakBadge, QuickCapture } from '../../components';

export default function TodayScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const {
    tasks,
    stats,
    getBigThree,
    getSuggestions,
    getWelcomeMessage,
    completeTaskAction,
    setEnergyLevel: setStoreEnergyLevel,
    context,
  } = useStore();

  const bigThree = getBigThree();
  const suggestions = getSuggestions();
  const welcomeMessage = getWelcomeMessage();

  const todayCompleted = tasks.filter(t =>
    t.status === 'completed' &&
    t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Would sync with backend here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleEnergySelect = async (level: 1 | 2 | 3 | 4 | 5) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnergyLevel(level);
    setStoreEnergyLevel(level);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary[500]}
        />
      }
    >
      {/* Header with greeting and stats */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subGreeting}>{welcomeMessage.subMessage}</Text>
          </View>
          <StreakBadge size="small" showLabel={false} />
        </View>

        <XPBar />
      </View>

      {/* Energy check-in (if not set today) */}
      {!context.energyLevel && (
        <View style={styles.energySection}>
          <Text style={styles.sectionTitle}>How's your energy?</Text>
          <View style={styles.energyButtons}>
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <Pressable
                key={level}
                onPress={() => handleEnergySelect(level)}
                style={({ pressed }) => [
                  styles.energyButton,
                  energyLevel === level && styles.energyButtonSelected,
                  pressed && styles.energyButtonPressed,
                ]}
              >
                <Ionicons
                  name="flash"
                  size={20}
                  color={energyLevel === level ? Colors.text.primary : Colors.energy[level]}
                />
                <Text style={[
                  styles.energyButtonText,
                  energyLevel === level && styles.energyButtonTextSelected,
                ]}>
                  {level === 1 ? 'Low' : level === 5 ? 'High' : level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Quick capture */}
      <View style={styles.section}>
        <QuickCapture />
      </View>

      {/* Today's progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{todayCompleted}</Text>
            <Text style={styles.progressLabel}>Completed</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={styles.progressNumber}>{bigThree.length}</Text>
            <Text style={styles.progressLabel}>Big 3</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={[styles.progressNumber, { color: Colors.xp }]}>
              +{stats.totalXP % 1000}
            </Text>
            <Text style={styles.progressLabel}>XP Today</Text>
          </View>
        </View>
      </View>

      {/* Big 3 for today */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Big 3</Text>
          <Text style={styles.sectionSubtitle}>Focus on these first</Text>
        </View>

        {bigThree.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success.default} />
            <Text style={styles.emptyStateText}>No critical tasks!</Text>
            <Text style={styles.emptyStateSubtext}>Add tasks or check suggested below</Text>
          </View>
        ) : (
          bigThree.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTaskAction(task.id)}
            />
          ))
        )}
      </View>

      {/* Smart suggestions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggested for you</Text>
          <Text style={styles.sectionSubtitle}>Based on your context</Text>
        </View>

        {suggestions.slice(0, 3).map((suggestion) => {
          const task = tasks.find(t => t.id === suggestion.taskId);
          if (!task) return null;

          return (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTaskAction(task.id)}
              showReasons={suggestion.reasons}
              compact
            />
          );
        })}

        {suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateText}>No suggestions yet</Text>
            <Text style={styles.emptyStateSubtext}>Add some tasks to get started</Text>
          </View>
        )}
      </View>

      {/* Motivational footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {todayCompleted === 0
            ? "Start with the smallest thing. Momentum builds."
            : todayCompleted < 3
              ? "You're moving. Keep it going."
              : "You're crushing it! 🔥"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  subGreeting: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  energySection: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  energyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  energyButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginHorizontal: 2,
  },
  energyButtonSelected: {
    backgroundColor: Colors.primary[500],
  },
  energyButtonPressed: {
    opacity: 0.7,
  },
  energyButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  energyButtonTextSelected: {
    color: Colors.text.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressNumber: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

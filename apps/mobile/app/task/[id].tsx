// ============================================
// TASK DETAIL MODAL
// Full task view with details and actions
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';

const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  someday: 'Someday',
};

const PRIORITY_COLORS = {
  critical: Colors.priority.critical,
  high: Colors.priority.high,
  medium: Colors.priority.medium,
  low: Colors.priority.low,
  someday: Colors.priority.someday,
};

export default function TaskDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, completeTaskAction, skipTask, startTaskAction } = useStore();

  const task = tasks.find(t => t.id === id);

  if (!task) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle" size={64} color={Colors.text.tertiary} />
        <Text style={styles.notFoundText}>Task not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const priorityColor = PRIORITY_COLORS[task.priority];

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeTaskAction(task.id);
    router.back();
  };

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTaskAction(task.id);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Task',
      'Mark this task as skipped?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            skipTask(task.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Priority bar */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {PRIORITY_LABELS[task.priority]}
          </Text>
        </View>
        <Text style={[
          styles.title,
          task.status === 'completed' && styles.titleCompleted,
        ]}>
          {task.title}
        </Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
      </View>

      {/* Meta info */}
      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={20} color={Colors.text.tertiary} />
            <Text style={styles.metaLabel}>Estimated</Text>
            <Text style={styles.metaValue}>{task.estimatedMinutes} min</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="flash" size={20} color={Colors.energy[task.energyRequired]} />
            <Text style={styles.metaLabel}>Energy</Text>
            <Text style={styles.metaValue}>Level {task.energyRequired}/5</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="star" size={20} color={Colors.xp} />
            <Text style={styles.metaLabel}>XP</Text>
            <Text style={[styles.metaValue, { color: Colors.xp }]}>+{task.baseXP}</Text>
          </View>
        </View>
      </View>

      {/* Due date */}
      {task.dueDate && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={18} color={Colors.text.tertiary} />
          <Text style={styles.infoText}>
            Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* Status */}
      <View style={styles.infoRow}>
        <Ionicons name="information-circle" size={18} color={Colors.text.tertiary} />
        <Text style={styles.infoText}>Status: {task.status.replace('_', ' ')}</Text>
      </View>

      {/* Tags */}
      {task.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tags}>
            {task.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      {task.status !== 'completed' && (
        <View style={styles.actions}>
          {task.status === 'pending' && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.startButton, pressed && { opacity: 0.8 }]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={20} color={Colors.text.primary} />
              <Text style={styles.actionButtonText}>Start Timer</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.completeButton, pressed && { opacity: 0.8 }]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.text.primary} />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.skipButton, pressed && { opacity: 0.8 }]}
            onPress={handleSkip}
          >
            <Ionicons name="arrow-forward-circle" size={20} color={Colors.text.secondary} />
            <Text style={[styles.actionButtonText, { color: Colors.text.secondary }]}>Skip</Text>
          </Pressable>
        </View>
      )}

      {task.status === 'completed' && task.completedAt && (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success.default} />
          <Text style={styles.completedText}>
            Completed {new Date(task.completedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  priorityBar: {
    height: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  priorityText: {
    ...Typography.label,
    fontWeight: '600',
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  description: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  metaCard: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.tertiary,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  metaValue: {
    ...Typography.label,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  infoText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  tagsSection: {
    marginTop: Spacing.md,
  },
  tagsLabel: {
    ...Typography.label,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.primary[500] + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.primary[400],
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  startButton: {
    backgroundColor: Colors.info.default,
  },
  completeButton: {
    backgroundColor: Colors.success.default,
  },
  skipButton: {
    backgroundColor: Colors.surface.default,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  actionButtonText: {
    ...Typography.label,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success.default + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  completedText: {
    ...Typography.body,
    color: Colors.success.default,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    ...Typography.h3,
    color: Colors.text.secondary,
  },
  backButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

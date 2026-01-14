// ============================================
// TASK CARD COMPONENT
// The core task interaction component
// Designed for minimal friction, maximum dopamine
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Task, TaskPriority } from '@momentum/shared';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onStart?: () => void;
  onPress?: () => void;
  showReasons?: string[];
  compact?: boolean;
}

export function TaskCard({
  task,
  onComplete,
  onStart,
  onPress,
  showReasons,
  compact = false,
}: TaskCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const priorityColors: Record<TaskPriority, string> = {
    critical: Colors.priority.critical,
    high: Colors.priority.high,
    medium: Colors.priority.medium,
    low: Colors.priority.low,
    someday: Colors.priority.someday,
  };

  const priorityColor = priorityColors[task.priority];

  return (
    <Animated.View style={[
      styles.container,
      compact && styles.containerCompact,
      { transform: [{ scale: scaleAnim }] },
    ]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {/* Priority indicator */}
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

        <View style={styles.content}>
          {/* Complete button */}
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => [
              styles.completeButton,
              pressed && styles.completeButtonPressed,
            ]}
          >
            <View style={[
              styles.checkbox,
              task.status === 'completed' && styles.checkboxCompleted,
            ]}>
              {task.status === 'completed' && (
                <Ionicons name="checkmark" size={16} color={Colors.text.primary} />
              )}
            </View>
          </Pressable>

          {/* Task info */}
          <View style={styles.info}>
            <Text
              style={[
                styles.title,
                task.status === 'completed' && styles.titleCompleted,
              ]}
              numberOfLines={compact ? 1 : 2}
            >
              {task.title}
            </Text>

            {!compact && (
              <View style={styles.meta}>
                {/* Time estimate */}
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                  <Text style={styles.metaText}>{task.estimatedMinutes}m</Text>
                </View>

                {/* Energy level */}
                <View style={styles.metaItem}>
                  <Ionicons name="flash-outline" size={14} color={Colors.energy[task.energyRequired]} />
                  <Text style={styles.metaText}>E{task.energyRequired}</Text>
                </View>

                {/* XP reward */}
                <View style={styles.metaItem}>
                  <Text style={styles.xpText}>+{task.baseXP} XP</Text>
                </View>
              </View>
            )}

            {/* Smart suggestion reasons */}
            {showReasons && showReasons.length > 0 && (
              <View style={styles.reasons}>
                {showReasons.slice(0, 2).map((reason, index) => (
                  <View key={index} style={styles.reasonTag}>
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick action */}
          {task.status === 'pending' && onStart && (
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
            >
              <Ionicons name="play" size={20} color={Colors.primary[500]} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.md,
  },
  containerCompact: {
    marginBottom: Spacing.xs,
  },
  pressable: {
    flexDirection: 'row',
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  completeButton: {
    padding: Spacing.xs,
  },
  completeButtonPressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.success.default,
    borderColor: Colors.success.default,
  },
  info: {
    flex: 1,
  },
  title: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  xpText: {
    ...Typography.caption,
    color: Colors.xp,
    fontWeight: '600',
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  reasonTag: {
    backgroundColor: Colors.primary[500] + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  reasonText: {
    ...Typography.caption,
    color: Colors.primary[400],
  },
  startButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: {
    backgroundColor: Colors.primary[500] + '40',
  },
});

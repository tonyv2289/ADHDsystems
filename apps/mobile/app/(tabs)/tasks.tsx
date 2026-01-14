// ============================================
// TASKS SCREEN
// All tasks view with filtering and sorting
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { TaskCard, QuickCapture } from '../../components';
import { TaskPriority, TaskStatus } from '@momentum/shared';

type FilterType = 'all' | 'pending' | 'completed' | 'today';

export default function TasksScreen() {
  const [filter, setFilter] = useState<FilterType>('pending');
  const { tasks, completeTaskAction, skipTask } = useStore();

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending':
        return task.status === 'pending';
      case 'completed':
        return task.status === 'completed';
      case 'today':
        const today = new Date().toDateString();
        return (
          (task.scheduledFor && new Date(task.scheduledFor).toDateString() === today) ||
          (task.dueDate && new Date(task.dueDate).toDateString() === today)
        );
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by priority then by creation date
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0, high: 1, medium: 2, low: 3, someday: 4
    };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'pending', label: 'To Do', count: tasks.filter(t => t.status === 'pending').length },
    { key: 'completed', label: 'Done', count: tasks.filter(t => t.status === 'completed').length },
    { key: 'today', label: 'Today', count: tasks.filter(t => {
      const today = new Date().toDateString();
      return (t.scheduledFor && new Date(t.scheduledFor).toDateString() === today) ||
             (t.dueDate && new Date(t.dueDate).toDateString() === today);
    }).length },
    { key: 'all', label: 'All', count: tasks.length },
  ];

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filters}>
        {filters.map(f => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterButton,
              filter === f.key && styles.filterButtonActive,
            ]}
          >
            <Text style={[
              styles.filterText,
              filter === f.key && styles.filterTextActive,
            ]}>
              {f.label}
            </Text>
            <View style={[
              styles.filterBadge,
              filter === f.key && styles.filterBadgeActive,
            ]}>
              <Text style={[
                styles.filterBadgeText,
                filter === f.key && styles.filterBadgeTextActive,
              ]}>
                {f.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Quick add */}
      <View style={styles.quickAdd}>
        <QuickCapture placeholder="Add a new task..." />
      </View>

      {/* Task list */}
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={filter === 'completed' ? 'checkmark-done-circle' : 'clipboard-outline'}
              size={64}
              color={Colors.text.tertiary}
            />
            <Text style={styles.emptyStateText}>
              {filter === 'completed'
                ? 'No completed tasks yet'
                : filter === 'pending'
                  ? 'All clear! Add a task above'
                  : 'No tasks here'}
            </Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTaskAction(task.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  filters: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.default,
    gap: Spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  filterText: {
    ...Typography.label,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.primary,
  },
  filterBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: Colors.primary[600],
  },
  filterBadgeText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  filterBadgeTextActive: {
    color: Colors.text.primary,
  },
  quickAdd: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
});

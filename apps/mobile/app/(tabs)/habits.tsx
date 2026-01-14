// ============================================
// HABITS SCREEN
// Daily habit tracking with visual streaks
// The bread and butter of ADHD consistency
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  completedDates: string[]; // ISO date strings
  xpPerCompletion: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
}

export default function HabitsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { addXP } = useStore();

  // Example habits - in real app these would come from store
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      name: 'Morning Meditation',
      icon: '🧘',
      color: '#8b5cf6',
      frequency: 'daily',
      currentStreak: 7,
      longestStreak: 14,
      completedToday: false,
      completedDates: [],
      xpPerCompletion: 15,
      timeOfDay: 'morning',
    },
    {
      id: '2',
      name: 'Exercise',
      icon: '💪',
      color: '#22c55e',
      frequency: 'weekdays',
      currentStreak: 3,
      longestStreak: 21,
      completedToday: true,
      completedDates: [],
      xpPerCompletion: 25,
      timeOfDay: 'morning',
    },
    {
      id: '3',
      name: 'Read 20 Pages',
      icon: '📚',
      color: '#3b82f6',
      frequency: 'daily',
      currentStreak: 12,
      longestStreak: 30,
      completedToday: false,
      completedDates: [],
      xpPerCompletion: 20,
      timeOfDay: 'evening',
    },
    {
      id: '4',
      name: 'Review Finances',
      icon: '💰',
      color: '#eab308',
      frequency: 'weekdays',
      currentStreak: 5,
      longestStreak: 10,
      completedToday: false,
      completedDates: [],
      xpPerCompletion: 30,
      timeOfDay: 'afternoon',
    },
    {
      id: '5',
      name: 'Check on Rentals',
      icon: '🏠',
      color: '#06b6d4',
      frequency: 'weekends',
      currentStreak: 2,
      longestStreak: 8,
      completedToday: false,
      completedDates: [],
      xpPerCompletion: 20,
      timeOfDay: 'anytime',
    },
    {
      id: '6',
      name: 'Client Follow-ups',
      icon: '📧',
      color: '#f97316',
      frequency: 'weekdays',
      currentStreak: 4,
      longestStreak: 15,
      completedToday: false,
      completedDates: [],
      xpPerCompletion: 25,
      timeOfDay: 'morning',
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleHabit = (habitId: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const wasCompleted = habit.completedToday;
        if (!wasCompleted) {
          addXP(habit.xpPerCompletion, `Completed habit: ${habit.name}`);
        }
        return {
          ...habit,
          completedToday: !wasCompleted,
          currentStreak: wasCompleted ? habit.currentStreak - 1 : habit.currentStreak + 1,
        };
      }
      return habit;
    }));
  };

  const completedCount = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = Math.round((completedCount / totalHabits) * 100);

  // Get last 7 days for streak visualization
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        date: date.toISOString().split('T')[0],
        isToday: i === 0,
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  const groupedHabits = {
    morning: habits.filter(h => h.timeOfDay === 'morning'),
    afternoon: habits.filter(h => h.timeOfDay === 'afternoon'),
    evening: habits.filter(h => h.timeOfDay === 'evening'),
    anytime: habits.filter(h => h.timeOfDay === 'anytime'),
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
      {/* Daily Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Today's Habits</Text>
          <Text style={styles.progressCount}>
            {completedCount}/{totalHabits}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` },
                completionPercentage === 100 && styles.progressFillComplete
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
        </View>

        {completionPercentage === 100 && (
          <View style={styles.perfectDay}>
            <Text style={styles.perfectDayText}>🎉 Perfect Day!</Text>
          </View>
        )}
      </View>

      {/* Week Overview */}
      <View style={styles.weekOverview}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekDays}>
          {last7Days.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={[
                styles.weekDayLabel,
                day.isToday && styles.weekDayLabelToday
              ]}>
                {day.day}
              </Text>
              <View style={[
                styles.weekDayDot,
                day.isToday && styles.weekDayDotToday,
                // In real app, check if all habits were completed that day
                index < 6 && Math.random() > 0.3 && styles.weekDayDotComplete,
              ]} />
            </View>
          ))}
        </View>
      </View>

      {/* Habits by Time of Day */}
      {Object.entries(groupedHabits).map(([timeOfDay, habitsList]) => {
        if (habitsList.length === 0) return null;

        const timeLabels: Record<string, string> = {
          morning: '🌅 Morning',
          afternoon: '☀️ Afternoon',
          evening: '🌙 Evening',
          anytime: '⏰ Anytime',
        };

        return (
          <View key={timeOfDay} style={styles.section}>
            <Text style={styles.sectionTitle}>{timeLabels[timeOfDay]}</Text>
            {habitsList.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={() => toggleHabit(habit.id)}
              />
            ))}
          </View>
        );
      })}

      {/* Add Habit Button */}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
      >
        <Ionicons name="add-circle" size={24} color={Colors.primary[500]} />
        <Text style={styles.addButtonText}>Add New Habit</Text>
      </Pressable>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.max(...habits.map(h => h.currentStreak))}
            </Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {habits.reduce((acc, h) => acc + h.currentStreak, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {habits.filter(h => h.currentStreak > 0).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Habit Card Component
function HabitCard({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.habitCard,
        habit.completedToday && styles.habitCardCompleted,
        pressed && styles.habitCardPressed,
      ]}
    >
      <View style={styles.habitLeft}>
        <View style={[styles.habitIcon, { backgroundColor: habit.color + '30' }]}>
          <Text style={styles.habitIconText}>{habit.icon}</Text>
        </View>
        <View style={styles.habitInfo}>
          <Text style={[
            styles.habitName,
            habit.completedToday && styles.habitNameCompleted
          ]}>
            {habit.name}
          </Text>
          <View style={styles.habitMeta}>
            <View style={styles.streakBadge}>
              <Ionicons
                name="flame"
                size={12}
                color={habit.currentStreak > 0 ? Colors.warning.default : Colors.text.tertiary}
              />
              <Text style={[
                styles.streakText,
                habit.currentStreak > 0 && styles.streakTextActive
              ]}>
                {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.xpBadge}>+{habit.xpPerCompletion} XP</Text>
          </View>
        </View>
      </View>

      <View style={[
        styles.checkbox,
        habit.completedToday && styles.checkboxChecked,
        { borderColor: habit.color }
      ]}>
        {habit.completedToday && (
          <Ionicons name="checkmark" size={18} color={Colors.text.primary} />
        )}
      </View>
    </Pressable>
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
  progressCard: {
    backgroundColor: Colors.surface.default,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  progressCount: {
    ...Typography.h3,
    color: Colors.primary[500],
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  progressFillComplete: {
    backgroundColor: Colors.success.default,
  },
  progressPercentage: {
    ...Typography.label,
    color: Colors.text.secondary,
    width: 40,
    textAlign: 'right',
  },
  perfectDay: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.success.default + '20',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  perfectDayText: {
    ...Typography.label,
    color: Colors.success.default,
  },
  weekOverview: {
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  weekDay: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weekDayLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  weekDayLabelToday: {
    color: Colors.primary[500],
    fontWeight: '700',
  },
  weekDayDot: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
  },
  weekDayDotToday: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  weekDayDotComplete: {
    backgroundColor: Colors.success.default,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  habitCardCompleted: {
    backgroundColor: Colors.surface.default,
    opacity: 0.8,
  },
  habitCardPressed: {
    backgroundColor: Colors.surface.hover,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconText: {
    fontSize: 24,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.text.tertiary,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  streakTextActive: {
    color: Colors.warning.default,
  },
  xpBadge: {
    ...Typography.caption,
    color: Colors.primary[400],
    backgroundColor: Colors.primary[500] + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.success.default,
    borderColor: Colors.success.default,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  addButtonPressed: {
    backgroundColor: Colors.surface.hover,
  },
  addButtonText: {
    ...Typography.body,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: Colors.surface.default,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  statsTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary[500],
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
});

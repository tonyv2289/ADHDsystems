// ============================================
// CHAINS SCREEN
// Momentum chains - linked task sequences
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { getChainProgress } from '@momentum/shared';

export default function ChainsScreen() {
  const { chains, tasks } = useStore();

  // Example chains to show the UI
  const exampleChains = [
    {
      id: 'morning',
      name: 'Morning Routine',
      description: 'Start your day right',
      taskIds: [],
      icon: '🌅',
      color: Colors.warning.default,
    },
    {
      id: 'workout',
      name: 'Workout Prep',
      description: 'Get ready, get moving',
      taskIds: [],
      icon: '💪',
      color: Colors.success.default,
    },
    {
      id: 'deep-work',
      name: 'Deep Work Session',
      description: '2-hour focus block',
      taskIds: [],
      icon: '🎯',
      color: Colors.info.default,
    },
  ];

  const displayChains = chains.length > 0 ? chains : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Momentum Chains</Text>
        <Text style={styles.subtitle}>
          Link tasks together. One triggers the next.
        </Text>
      </View>

      {/* Create new chain button */}
      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.createButtonPressed,
        ]}
      >
        <Ionicons name="add-circle" size={24} color={Colors.primary[500]} />
        <Text style={styles.createButtonText}>Create New Chain</Text>
      </Pressable>

      {/* Chain templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start Templates</Text>
        <View style={styles.templateGrid}>
          {exampleChains.map(template => (
            <Pressable
              key={template.id}
              style={({ pressed }) => [
                styles.templateCard,
                pressed && styles.templateCardPressed,
              ]}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDesc}>{template.description}</Text>
              <View style={[styles.templateAccent, { backgroundColor: template.color }]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Your chains */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Chains</Text>

        {displayChains.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="git-branch-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No chains yet</Text>
            <Text style={styles.emptyStateText}>
              Create a chain to link tasks together.{'\n'}
              Complete one, and the next appears automatically.
            </Text>
          </View>
        ) : (
          displayChains.map(chain => {
            const progress = getChainProgress(chain, tasks);
            return (
              <Pressable
                key={chain.id}
                style={({ pressed }) => [
                  styles.chainCard,
                  pressed && styles.chainCardPressed,
                ]}
              >
                <View style={styles.chainHeader}>
                  <Text style={styles.chainName}>{chain.name}</Text>
                  <View style={styles.chainProgress}>
                    <Text style={styles.chainProgressText}>
                      {progress.completed}/{progress.total}
                    </Text>
                  </View>
                </View>
                {chain.description && (
                  <Text style={styles.chainDescription}>{chain.description}</Text>
                )}
                <View style={styles.chainProgressBar}>
                  <View
                    style={[
                      styles.chainProgressFill,
                      { width: `${progress.percentage}%` },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* How chains work */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Chains Work</Text>
        <View style={styles.howItWorks}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Link Tasks</Text>
              <Text style={styles.stepText}>Connect related tasks in sequence</Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete One</Text>
              <Text style={styles.stepText}>Finish the first micro-task</Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Next Appears</Text>
              <Text style={styles.stepText}>Momentum carries you forward</Text>
            </View>
          </View>
        </View>
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
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  createButton: {
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
  createButtonPressed: {
    backgroundColor: Colors.surface.hover,
  },
  createButtonText: {
    ...Typography.body,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  templateCardPressed: {
    backgroundColor: Colors.surface.hover,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  templateName: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  templateDesc: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  templateAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  chainCard: {
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  chainCardPressed: {
    backgroundColor: Colors.surface.hover,
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chainName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  chainProgress: {
    backgroundColor: Colors.primary[500] + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  chainProgressText: {
    ...Typography.caption,
    color: Colors.primary[400],
  },
  chainDescription: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  chainProgressBar: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  chainProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  howItWorks: {
    backgroundColor: Colors.surface.default,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  stepText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.primary[500] + '50',
    marginLeft: 15,
    marginVertical: 4,
  },
});

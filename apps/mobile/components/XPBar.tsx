// ============================================
// XP BAR COMPONENT
// Gamification progress visualization
// Dopamine-inducing level progress
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useStore } from '../store/useStore';

interface XPBarProps {
  compact?: boolean;
}

export function XPBar({ compact = false }: XPBarProps) {
  const { getXPProgress, stats } = useStore();
  const progress = getXPProgress();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress.progressPercent,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();

    // Pulse animation when XP changes
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stats.totalXP]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.compactLevelBadge}>
          <Text style={styles.compactLevelText}>{progress.currentLevel.level}</Text>
        </View>
        <View style={styles.compactBarContainer}>
          <Animated.View style={[styles.compactProgress, { width: widthInterpolation }]}>
            <LinearGradient
              colors={[Colors.primary[400], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.compactXP}>{stats.totalXP}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      {/* Level badge */}
      <View style={styles.levelBadge}>
        <LinearGradient
          colors={[Colors.level, Colors.primary[600]]}
          style={styles.levelGradient}
        >
          <Text style={styles.levelNumber}>{progress.currentLevel.level}</Text>
        </LinearGradient>
        <Text style={styles.levelName}>{progress.currentLevel.name}</Text>
      </View>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.xpText}>
            {stats.totalXP.toLocaleString()} XP
          </Text>
          {progress.nextLevel && (
            <Text style={styles.nextLevelText}>
              {progress.xpToNext.toLocaleString()} to Level {progress.nextLevel.level}
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.barContainer}>
          <Animated.View style={[styles.progressBar, { width: widthInterpolation }]}>
            <LinearGradient
              colors={[Colors.primary[400], Colors.primary[500], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Shine effect */}
            <View style={styles.shine} />
          </Animated.View>
        </View>

        {/* Progress percentage */}
        <Text style={styles.percentText}>{progress.progressPercent}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelBadge: {
    alignItems: 'center',
  },
  levelGradient: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  levelName: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  progressSection: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  xpText: {
    ...Typography.h4,
    color: Colors.xp,
  },
  nextLevelText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  barContainer: {
    height: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  percentText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: 4,
    textAlign: 'right',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactLevelBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.level,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLevelText: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  compactBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  compactProgress: {
    height: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  compactXP: {
    ...Typography.caption,
    color: Colors.xp,
    minWidth: 50,
    textAlign: 'right',
  },
});

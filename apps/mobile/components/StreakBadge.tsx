// ============================================
// STREAK BADGE COMPONENT
// Displays current streak with visual flair
// Max visible streak of 7 (ADHD-friendly)
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useStore } from '../store/useStore';
import { DEFAULTS } from '@momentum/shared';

interface StreakBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function StreakBadge({ size = 'medium', showLabel = true }: StreakBadgeProps) {
  const { stats, streaks } = useStore();
  const mainStreak = streaks.find(s => s.type === 'daily');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Display max 7 to prevent devastating losses
  const displayStreak = Math.min(stats.currentStreak, DEFAULTS.MAX_VISIBLE_STREAK);
  const hasStreak = stats.currentStreak > 0;

  useEffect(() => {
    if (hasStreak) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasStreak]);

  const sizeStyles = {
    small: {
      container: { width: 48, height: 48 },
      icon: 16,
      number: Typography.label,
    },
    medium: {
      container: { width: 64, height: 64 },
      icon: 20,
      number: Typography.h4,
    },
    large: {
      container: { width: 80, height: 80 },
      icon: 28,
      number: Typography.h2,
    },
  };

  const currentSize = sizeStyles[size];

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (!hasStreak) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.badgeInactive, currentSize.container]}>
          <Ionicons
            name="flame-outline"
            size={currentSize.icon}
            color={Colors.text.tertiary}
          />
          <Text style={[currentSize.number, styles.numberInactive]}>0</Text>
        </View>
        {showLabel && (
          <Text style={styles.label}>Start a streak!</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          currentSize.container,
          { opacity: glowOpacity },
        ]}
      />

      {/* Badge */}
      <View style={[styles.badge, currentSize.container]}>
        <Ionicons
          name="flame"
          size={currentSize.icon}
          color={Colors.streak}
        />
        <Text style={[currentSize.number, styles.number]}>{displayStreak}</Text>
      </View>

      {/* Label */}
      {showLabel && (
        <Text style={styles.label}>
          {displayStreak === 7 ? '7+ day streak!' : `${displayStreak} day streak`}
        </Text>
      )}

      {/* Shield indicator */}
      {mainStreak && mainStreak.shieldsAvailable > 0 && (
        <View style={styles.shields}>
          {Array.from({ length: Math.min(mainStreak.shieldsAvailable, 3) }).map((_, i) => (
            <Ionicons
              key={i}
              name="shield"
              size={12}
              color={Colors.info.default}
              style={styles.shield}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.streak,
  },
  badgeInactive: {
    borderColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  glow: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.streak,
  },
  number: {
    color: Colors.text.primary,
    marginTop: -2,
  },
  numberInactive: {
    color: Colors.text.tertiary,
    marginTop: -2,
  },
  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  shields: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  shield: {
    opacity: 0.8,
  },
});

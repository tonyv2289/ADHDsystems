// ============================================
// DOMAIN CARD COMPONENT
// Card for displaying Client/Property/Job domains
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface DomainCardProps {
  id: string;
  name: string;
  type: 'client' | 'property' | 'job' | 'personal' | 'family';
  color: string;
  icon: string;
  subtitle?: string;
  stats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  alerts?: number;
  onPress?: () => void;
}

export function DomainCard({
  name,
  type,
  color,
  icon,
  subtitle,
  stats = [],
  alerts = 0,
  onPress,
}: DomainCardProps) {
  const typeLabels = {
    client: 'Client',
    property: 'Property',
    job: 'Job',
    personal: 'Personal',
    family: 'Family',
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Color accent */}
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.type}>{typeLabels[type]}</Text>
          </View>
          {alerts > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertText}>{alerts}</Text>
            </View>
          )}
        </View>

        {/* Subtitle */}
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}

        {/* Stats row */}
        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.stat}>
                <Text style={[styles.statValue, stat.color && { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  pressed: {
    backgroundColor: Colors.surface.hover,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  type: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  alertBadge: {
    backgroundColor: Colors.error.default,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  alertText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginLeft: 48, // Align with title
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginLeft: 48,
    gap: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
});

// ============================================
// ALERT CARD COMPONENT
// For displaying urgent items across all domains
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface AlertCardProps {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  domainName?: string;
  domainType?: string;
  actionLabel?: string;
  onPress?: () => void;
  onAction?: () => void;
}

export function AlertCard({
  severity,
  title,
  message,
  domainName,
  actionLabel,
  onPress,
  onAction,
}: AlertCardProps) {
  const severityConfig = {
    critical: {
      bg: Colors.error.default + '15',
      border: Colors.error.default,
      icon: 'alert-circle' as const,
      iconColor: Colors.error.default,
    },
    warning: {
      bg: Colors.warning.default + '15',
      border: Colors.warning.default,
      icon: 'warning' as const,
      iconColor: Colors.warning.default,
    },
    info: {
      bg: Colors.info.default + '15',
      border: Colors.info.default,
      icon: 'information-circle' as const,
      iconColor: Colors.info.default,
    },
  };

  const config = severityConfig[severity];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: config.bg, borderLeftColor: config.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        {domainName && (
          <Text style={styles.domain}>{domainName}</Text>
        )}
      </View>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: config.border },
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={[styles.actionText, { color: config.border }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.label,
    color: Colors.text.primary,
  },
  message: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  domain: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

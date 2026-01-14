// ============================================
// FINANCIAL SUMMARY COMPONENT
// Shows income across all domains
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface FinancialSummaryProps {
  monthlyRecurring: number;
  propertyIncome: number;
  outstanding: number;
  onPress?: () => void;
}

export function FinancialSummary({
  monthlyRecurring,
  propertyIncome,
  outstanding,
  onPress,
}: FinancialSummaryProps) {
  const totalMonthly = monthlyRecurring + propertyIncome;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="wallet" size={20} color={Colors.success.default} />
          <Text style={styles.title}>Monthly Income</Text>
        </View>
        <Text style={styles.total}>{formatCurrency(totalMonthly)}</Text>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: Colors.primary[500] }]} />
          <Text style={styles.itemLabel}>Consulting</Text>
          <Text style={styles.itemValue}>{formatCurrency(monthlyRecurring)}</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: Colors.success.default }]} />
          <Text style={styles.itemLabel}>Properties</Text>
          <Text style={styles.itemValue}>{formatCurrency(propertyIncome)}</Text>
        </View>
        {outstanding > 0 && (
          <View style={styles.item}>
            <View style={[styles.dot, { backgroundColor: Colors.warning.default }]} />
            <Text style={styles.itemLabel}>Outstanding</Text>
            <Text style={[styles.itemValue, { color: Colors.warning.default }]}>
              {formatCurrency(outstanding)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  pressed: {
    backgroundColor: Colors.surface.hover,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.label,
    color: Colors.text.secondary,
  },
  total: {
    ...Typography.h3,
    color: Colors.success.default,
  },
  breakdown: {
    gap: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
  },
  itemValue: {
    ...Typography.label,
    color: Colors.text.primary,
  },
});

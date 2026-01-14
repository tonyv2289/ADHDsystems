// ============================================
// DOMAINS SCREEN (Command Center)
// Your multi-life dashboard
// Clients, Properties, Job - all in one view
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
import { DomainCard, AlertCard, FinancialSummary } from '../../components';

type TabType = 'all' | 'clients' | 'properties' | 'job';

export default function DomainsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - would come from store
  const clients = [
    {
      id: '1',
      name: 'Acme Corp',
      type: 'client' as const,
      color: '#f97316',
      icon: '💼',
      subtitle: 'Retainer: $5,000/mo',
      stats: [
        { label: 'Tasks', value: 4 },
        { label: 'Hours', value: '12/20' },
        { label: 'Health', value: '92%', color: Colors.success.default },
      ],
      alerts: 0,
    },
    {
      id: '2',
      name: 'Beta Inc',
      type: 'client' as const,
      color: '#3b82f6',
      icon: '💼',
      subtitle: 'Hourly: $150/hr',
      stats: [
        { label: 'Tasks', value: 7 },
        { label: 'Hours', value: '8.5' },
        { label: 'Health', value: '78%', color: Colors.warning.default },
      ],
      alerts: 1,
    },
    {
      id: '3',
      name: 'Gamma LLC',
      type: 'client' as const,
      color: '#8b5cf6',
      icon: '💼',
      subtitle: 'Retainer: $3,500/mo',
      stats: [
        { label: 'Tasks', value: 2 },
        { label: 'Hours', value: '6/15' },
        { label: 'Health', value: '100%', color: Colors.success.default },
      ],
      alerts: 0,
    },
  ];

  const properties = [
    {
      id: 'p1',
      name: '123 Main Street',
      type: 'property' as const,
      color: '#22c55e',
      icon: '🏠',
      subtitle: 'Rental - Occupied',
      stats: [
        { label: 'Rent', value: '$2,400' },
        { label: 'Status', value: 'Paid', color: Colors.success.default },
      ],
      alerts: 0,
    },
    {
      id: 'p2',
      name: '456 Oak Avenue',
      type: 'property' as const,
      color: '#06b6d4',
      icon: '🏠',
      subtitle: 'Rental - Occupied',
      stats: [
        { label: 'Rent', value: '$1,800' },
        { label: 'Status', value: 'Due', color: Colors.warning.default },
      ],
      alerts: 1,
    },
    {
      id: 'p3',
      name: '789 Home Base',
      type: 'property' as const,
      color: '#ec4899',
      icon: '🏡',
      subtitle: 'Primary Residence',
      stats: [
        { label: 'Tasks', value: 3 },
      ],
      alerts: 0,
    },
  ];

  const job = {
    id: 'j1',
    name: 'Tech Company',
    type: 'job' as const,
    color: '#eab308',
    icon: '💻',
    subtitle: 'Senior Engineer',
    stats: [
      { label: 'Projects', value: 2 },
      { label: 'Tasks', value: 8 },
      { label: 'PTO', value: '15 days' },
    ],
    alerts: 0,
  };

  const alerts = [
    {
      id: 'a1',
      severity: 'warning' as const,
      title: 'Invoice Due Soon',
      message: 'Beta Inc invoice #INV-2401-042 due in 3 days',
      domainName: 'Beta Inc',
      actionLabel: 'Send',
    },
    {
      id: 'a2',
      severity: 'warning' as const,
      title: 'Rent Due',
      message: '456 Oak Avenue rent due tomorrow',
      domainName: '456 Oak Avenue',
      actionLabel: 'Check',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const tabs = [
    { key: 'all', label: 'All', count: clients.length + properties.length + 1 },
    { key: 'clients', label: 'Clients', count: clients.length },
    { key: 'properties', label: 'Properties', count: properties.length },
    { key: 'job', label: 'Job', count: 1 },
  ];

  const filteredDomains = () => {
    switch (activeTab) {
      case 'clients':
        return clients;
      case 'properties':
        return properties;
      case 'job':
        return [job];
      default:
        return [...clients, ...properties, job];
    }
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
      {/* Financial Summary */}
      <FinancialSummary
        monthlyRecurring={8500}
        propertyIncome={4200}
        outstanding={2400}
      />

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Needs Attention</Text>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{alerts.length}</Text>
            </View>
          </View>
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              severity={alert.severity}
              title={alert.title}
              message={alert.message}
              domainName={alert.domainName}
              actionLabel={alert.actionLabel}
            />
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key as TabType)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabBadge,
              activeTab === tab.key && styles.tabBadgeActive,
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === tab.key && styles.tabBadgeTextActive,
              ]}>
                {tab.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Domains List */}
      <View style={styles.section}>
        {filteredDomains().map(domain => (
          <DomainCard
            key={domain.id}
            {...domain}
          />
        ))}
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction}>
          <Ionicons name="add-circle" size={20} color={Colors.primary[500]} />
          <Text style={styles.quickActionText}>Add Client</Text>
        </Pressable>
        <Pressable style={styles.quickAction}>
          <Ionicons name="add-circle" size={20} color={Colors.success.default} />
          <Text style={styles.quickActionText}>Add Property</Text>
        </Pressable>
        <Pressable style={styles.quickAction}>
          <Ionicons name="time" size={20} color={Colors.info.default} />
          <Text style={styles.quickActionText}>Log Time</Text>
        </Pressable>
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
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  alertCount: {
    backgroundColor: Colors.error.default,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  alertCountText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.default,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    ...Typography.label,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  tabBadge: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary[600],
  },
  tabBadgeText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  tabBadgeTextActive: {
    color: Colors.text.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});

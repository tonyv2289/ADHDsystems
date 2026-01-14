// ============================================
// QUICK CAPTURE COMPONENT
// Ultra-low friction task entry
// Type or speak, system handles the rest
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';

interface QuickCaptureProps {
  placeholder?: string;
  onCapture?: () => void;
}

export function QuickCapture({
  placeholder = "Quick add a task...",
  onCapture,
}: QuickCaptureProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { quickAdd } = useStore();

  const handleSubmit = async () => {
    if (!text.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate the button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    quickAdd(text.trim());
    setText('');
    Keyboard.dismiss();
    onCapture?.();
  };

  const handleVoiceInput = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Voice input would be implemented with expo-speech or similar
    // For now, just focus the text input
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={isFocused ? Colors.primary[500] : Colors.text.tertiary}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
        />

        {/* Voice input button */}
        <Pressable
          onPress={handleVoiceInput}
          style={({ pressed }) => [
            styles.voiceButton,
            pressed && styles.voiceButtonPressed,
          ]}
        >
          <Ionicons
            name="mic-outline"
            size={20}
            color={Colors.text.tertiary}
          />
        </Pressable>
      </View>

      {/* Submit button - only show when there's text */}
      {text.length > 0 && (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.text.primary} />
          </Pressable>
        </Animated.View>
      )}

      {/* Quick tips when focused */}
      {isFocused && text.length === 0 && (
        <View style={styles.tips}>
          <Text style={styles.tipText}>
            Try: "Call mom tomorrow" or "Urgent: finish report"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.default,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.sm,
  },
  containerFocused: {
    borderColor: Colors.primary[500],
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonPressed: {
    backgroundColor: Colors.surface.hover,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  submitButtonPressed: {
    backgroundColor: Colors.primary[600],
  },
  tips: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
});

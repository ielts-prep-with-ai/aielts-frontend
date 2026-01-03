import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface DatePickerButtonProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  helperText?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DatePickerButton: React.FC<DatePickerButtonProps> = ({
  value,
  onChange,
  label,
  helperText,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const scale = useSharedValue(1);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS - just update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleIOSCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(false);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(null);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const minimumDate = new Date();
  const maximumDate = new Date();
  maximumDate.setFullYear(maximumDate.getFullYear() + 2);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <AnimatedPressable
        style={[styles.dateButton, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.dateContent}>
          <IconSymbol name="calendar" size={24} color="#fff" />
          <Text style={styles.dateText}>
            {value ? formatDate(value) : 'Select Test Date'}
          </Text>
        </View>
        {value && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            hitSlop={8}
          >
            <IconSymbol name="xmark.circle.fill" size={20} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
        )}
      </AnimatedPressable>

      {helperText && <Text style={styles.helperText}>{helperText}</Text>}

      {/* Android shows picker directly */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleDateChange}
        />
      )}

      {/* iOS shows picker in modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="none"
          onRequestClose={handleIOSCancel}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleIOSCancel}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.modalBackdropOverlay}
            />
          </Pressable>

          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.pickerContainer}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={handleIOSCancel} hitSlop={8}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Select Date</Text>
              <Pressable onPress={handleIOSConfirm} hitSlop={8}>
                <Text style={styles.doneButton}>Done</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={handleDateChange}
              textColor="#000"
            />
          </Animated.View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3BB9F0',
  },
});

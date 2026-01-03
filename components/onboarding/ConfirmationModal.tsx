import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { sharedStyles } from './styles';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
}) => {
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, backdropStyle, styles.backdropPressable]}
          onPress={handleCancel}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop]} />
        </AnimatedPressable>

        <Animated.View style={[sharedStyles.modalContainer, modalStyle]}>
          <Text style={sharedStyles.modalTitle}>{title}</Text>
          <Text style={sharedStyles.modalMessage}>{message}</Text>

          <View style={sharedStyles.modalButtonContainer}>
            <Pressable
              style={[sharedStyles.modalButton, sharedStyles.modalCancelButton]}
              onPress={handleCancel}
            >
              <Text style={sharedStyles.modalCancelButtonText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              style={[
                sharedStyles.modalButton,
                confirmVariant === 'danger'
                  ? sharedStyles.modalDangerButton
                  : sharedStyles.modalConfirmButton,
              ]}
              onPress={handleConfirm}
            >
              <Text style={sharedStyles.modalConfirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    zIndex: 0,
  },
});

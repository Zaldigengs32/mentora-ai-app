import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Batal',
  type = 'info', 
  isDark = false,
  buttons = null, 
}) {
  if (!visible) return null;

  const cardBg = isDark ? '#1e1e24' : '#ffffff';
  const borderColor = isDark ? '#2d2d34' : '#e2e8f0';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#a1a1aa' : '#64748b';
  const cancelBg = isDark ? '#27272a' : '#f1f5f9';
  const cancelTextColor = isDark ? '#e4e4e7' : '#334155';

  let iconName = 'information-circle';
  let iconColor = '#0ea5e9'; 
  let primaryButtonBg = '#0ea5e9';

  switch (type) {
    case 'success':
      iconName = 'checkmark-circle';
      iconColor = '#10b981'; 
      primaryButtonBg = '#10b981';
      break;
    case 'error':
      iconName = 'close-circle';
      iconColor = '#ef4444'; 
      primaryButtonBg = '#ef4444';
      break;
    case 'warning':
      iconName = 'alert-circle';
      iconColor = '#f59e0b'; 
      primaryButtonBg = '#f59e0b';
      break;
    case 'info':
    default:
      iconName = 'information-circle';
      iconColor = '#0ea5e9'; 
      primaryButtonBg = '#0ea5e9';
      break;
  }

  let alertButtons = [];
  if (buttons && buttons.length > 0) {
    alertButtons = buttons;
  } else if (onConfirm) {
    alertButtons = [
      { text: cancelText, onPress: onClose, style: 'cancel' },
      { text: confirmText, onPress: onConfirm, style: 'default' },
    ];
  } else {
    alertButtons = [
      { text: confirmText, onPress: onClose, style: 'default' },
    ];
  }

  const stackButtons = alertButtons.length > 2;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
                <Ionicons name={iconName} size={36} color={iconColor} />
              </View>

              {title ? (
                <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              ) : null}
              {message ? (
                <Text style={[styles.message, { color: subTextColor }]}>{message}</Text>
              ) : null}

              <View
                style={[
                  stackButtons ? styles.buttonColumn : styles.buttonRow,
                  !stackButtons && alertButtons.length > 1 ? styles.rowGap : null,
                ]}
              >
                {alertButtons.map((btn, index) => {
                  const isCancelStyle = btn.style === 'cancel';
                  const btnBg = isCancelStyle ? cancelBg : primaryButtonBg;
                  const btnTextColor = isCancelStyle ? cancelTextColor : '#ffffff';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        stackButtons ? styles.stackButtonMargin : null,
                        { backgroundColor: btnBg },
                      ]}
                      onPress={() => {
                        onClose(); 
                        if (btn.onPress) {
                          btn.onPress();
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.buttonText, { color: btnTextColor }]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: width > 400 ? 340 : '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'stretch',
  },
  rowGap: {
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackButtonMargin: {
    flex: 0, 
    width: '100%',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

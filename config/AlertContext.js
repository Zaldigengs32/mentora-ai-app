import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Batal',
    type: 'info',
    buttons: null,
  });
  const [isDark, setIsDark] = useState(true);

  const showAlert = async ({
    title = '',
    message = '',
    onConfirm = null,
    confirmText = 'OK',
    cancelText = 'Batal',
    type = 'info',
    buttons = null,
  }) => {
    try {
      const storedTheme = await AsyncStorage.getItem('app_appearance');
      if (storedTheme) {
        setIsDark(storedTheme === 'dark');
      } else {
        setIsDark(true); 
      }
    } catch (e) {
      setIsDark(true);
    }

    setConfig({
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type,
      buttons,
    });
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handleConfirm = () => {
    setVisible(false);
    if (config.onConfirm) {
      config.onConfirm();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        onClose={hideAlert}
        onConfirm={config.onConfirm ? handleConfirm : null}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        type={config.type}
        isDark={isDark}
        buttons={config.buttons}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

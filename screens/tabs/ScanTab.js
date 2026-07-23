import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, Dimensions, Animated, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../config/localization';

const handleBoxMove = (dx, dy, startBox, displayWidth, displayHeight) => {
  let nextX = Math.max(0, startBox.x + dx);
  let nextY = Math.max(0, startBox.y + dy);

  if (nextX + startBox.width > displayWidth) {
    nextX = displayWidth - startBox.width;
  }
  if (nextY + startBox.height > displayHeight) {
    nextY = displayHeight - startBox.height;
  }

  return { x: nextX, y: nextY, width: startBox.width, height: startBox.height };
};

const handleTopLeftMove = (dx, dy, startBox, minSize) => {
  let nextX = Math.max(0, startBox.x + dx);
  let nextY = Math.max(0, startBox.y + dy);

  let nextW = startBox.width - (nextX - startBox.x);
  let nextH = startBox.height - (nextY - startBox.y);

  if (nextW < minSize) {
    nextX = startBox.x + startBox.width - minSize;
    nextW = minSize;
  }
  if (nextH < minSize) {
    nextY = startBox.y + startBox.height - minSize;
    nextH = minSize;
  }

  return { x: nextX, y: nextY, width: nextW, height: nextH };
};

const handleTopRightMove = (dx, dy, startBox, minSize, displayWidth) => {
  let nextY = Math.max(0, startBox.y + dy);
  let nextW = Math.min(displayWidth - startBox.x, startBox.width + dx);
  let nextH = startBox.height - (nextY - startBox.y);

  if (nextW < minSize) nextW = minSize;
  if (nextH < minSize) {
    nextY = startBox.y + startBox.height - minSize;
    nextH = minSize;
  }

  return { x: startBox.x, y: nextY, width: nextW, height: nextH };
};

const handleBottomLeftMove = (dx, dy, startBox, minSize, displayHeight) => {
  let nextX = Math.max(0, startBox.x + dx);
  let nextW = startBox.width - (nextX - startBox.x);
  let nextH = Math.min(displayHeight - startBox.y, startBox.height + dy);

  if (nextW < minSize) {
    nextX = startBox.x + startBox.width - minSize;
    nextW = minSize;
  }
  if (nextH < minSize) nextH = minSize;

  return { x: nextX, y: startBox.y, width: nextW, height: nextH };
};

const handleBottomRightMove = (dx, dy, startBox, minSize, displayWidth, displayHeight) => {
  let nextW = Math.min(displayWidth - startBox.x, startBox.width + dx);
  let nextH = Math.min(displayHeight - startBox.y, startBox.height + dy);

  if (nextW < minSize) nextW = minSize;
  if (nextH < minSize) nextH = minSize;

  return { x: startBox.x, y: startBox.y, width: nextW, height: nextH };
};

function PermissionView({ isDark, language, onPermissionRequest }) {
  return (
    <View style={[styles.permissionContainer, { backgroundColor: isDark ? '#121214' : '#f0f9ff' }]}>
      <Ionicons name="camera-outline" size={64} color={isDark ? '#94a3b8' : '#64748b'} style={styles.permissionIcon} />
      <Text style={[styles.permissionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
        {translations[language].permissionTitle}
      </Text>
      <Text style={[styles.permissionSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
        {translations[language].permissionSubtitle}
      </Text>
      <TouchableOpacity style={styles.permissionButton} onPress={onPermissionRequest}>
        <Text style={styles.permissionButtonText}>{translations[language].permissionButton}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScanningView({ language, croppedImageUri, scanAnim }) {
  return (
    <View style={styles.scanContainer}>
      <View style={styles.scanningCard}>
        <Text style={styles.scanningTitle}>{translations[language].recogText}</Text>
        <View style={styles.scanningImageContainer}>
          <Image source={{ uri: croppedImageUri }} style={styles.scanningImage} />
          <Animated.View style={[
            styles.laserLine,
            {
              transform: [{
                translateX: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 276]
                })
              }]
            }
          ]} />
        </View>
        <ActivityIndicator color="#0ea5e9" size="small" style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

function CropModal({
  visible,
  onCancel,
  onConfirm,
  displayWidth,
  displayHeight,
  tempImageUri,
  cropBox,
  onTouchMove,
  onTouchEnd,
  onTouchStart,
}) {
  const maskBg = 'rgba(0, 0, 0, 0.7)';
  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.cropContainer}>
        <TouchableOpacity style={styles.cropBackButton} onPress={onCancel}>
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View
          style={{ width: displayWidth, height: displayHeight, position: 'relative', overflow: 'hidden' }}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {tempImageUri ? (
            <Image source={{ uri: tempImageUri }} style={{ width: displayWidth, height: displayHeight }} resizeMode="contain" />
          ) : null}

          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: cropBox.y, backgroundColor: maskBg }} />
          <View style={{ position: 'absolute', top: cropBox.y + cropBox.height, left: 0, right: 0, bottom: 0, backgroundColor: maskBg }} />
          <View style={{ position: 'absolute', top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height, backgroundColor: maskBg }} />
          <View style={{ position: 'absolute', top: cropBox.y, left: cropBox.x + cropBox.width, right: 0, height: cropBox.height, backgroundColor: maskBg }} />

          <View style={{
            position: 'absolute',
            left: cropBox.x,
            top: cropBox.y,
            width: cropBox.width,
            height: cropBox.height,
            borderWidth: 1.5,
            borderColor: '#ffffff',
          }}>
            <View style={[styles.gridLineHorizontal, { top: '33.3%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '66.6%' }]} />
            <View style={[styles.gridLineVertical, { left: '33.3%' }]} />
            <View style={[styles.gridLineVertical, { left: '66.6%' }]} />

            <View style={{ position: 'absolute', left: -2, top: -2, width: 24, height: 24, borderLeftWidth: 4, borderTopWidth: 4, borderColor: '#0ea5e9', borderTopLeftRadius: 4 }} />
            <View style={{ position: 'absolute', right: -2, top: -2, width: 24, height: 24, borderRightWidth: 4, borderTopWidth: 4, borderColor: '#0ea5e9', borderTopRightRadius: 4 }} />
            <View style={{ position: 'absolute', left: -2, bottom: -2, width: 24, height: 24, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: '#0ea5e9', borderBottomLeftRadius: 4 }} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRightWidth: 4, borderBottomWidth: 4, borderColor: '#0ea5e9', borderBottomRightRadius: 4 }} />

            <View style={{ position: 'absolute', top: -3, left: '50%', marginLeft: -12, width: 24, height: 6, backgroundColor: '#ffffff', borderRadius: 3 }} />
            <View style={{ position: 'absolute', bottom: -3, left: '50%', marginLeft: -12, width: 24, height: 6, backgroundColor: '#ffffff', borderRadius: 3 }} />

            <View style={{ position: 'absolute', bottom: -35, left: -100, right: -100, alignItems: 'center' }}>
              <Text style={styles.cropSubtext}>Crop only one question</Text>
            </View>
          </View>

          <View
            style={{
              position: 'absolute',
              left: cropBox.x + 10,
              top: cropBox.y + 10,
              width: Math.max(10, cropBox.width - 20),
              height: Math.max(10, cropBox.height - 20),
              backgroundColor: 'transparent',
            }}
            onTouchStart={(e) => onTouchStart('box', e)}
          />

          <View style={{ position: 'absolute', left: cropBox.x - 20, top: cropBox.y - 20, width: 40, height: 40, backgroundColor: 'transparent', zIndex: 10 }} onTouchStart={(e) => onTouchStart('topLeft', e)} />
          <View style={{ position: 'absolute', left: cropBox.x + cropBox.width - 20, top: cropBox.y - 20, width: 40, height: 40, backgroundColor: 'transparent', zIndex: 10 }} onTouchStart={(e) => onTouchStart('topRight', e)} />
          <View style={{ position: 'absolute', left: cropBox.x - 20, top: cropBox.y + cropBox.height - 20, width: 40, height: 40, backgroundColor: 'transparent', zIndex: 10 }} onTouchStart={(e) => onTouchStart('bottomLeft', e)} />
          <View style={{ position: 'absolute', left: cropBox.x + cropBox.width - 20, top: cropBox.y + cropBox.height - 20, width: 40, height: 40, backgroundColor: 'transparent', zIndex: 10 }} onTouchStart={(e) => onTouchStart('bottomRight', e)} />
        </View>

        <View style={styles.cropFooter}>
          <TouchableOpacity style={styles.cropConfirmButtonCircle} onPress={onConfirm}>
            <Ionicons name="checkmark" size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ScanTab({ onImageScanned, onShowHistory, language = 'id', isDark }) {
  const [permission, requestPermission] = useCameraPermissions();
  const hasAutoPrompted = useRef(false);

  const requestCameraPermission = async () => {
    try {
      const res = await requestPermission();
      if (res && !res.granted) {
        Alert.alert(
          language === 'id' ? 'Akses Ditolak' : 'Access Denied',
          language === 'id'
            ? 'Gagal mendapatkan izin akses kamera.'
            : 'Failed to obtain camera access permission.'
        );
      }
    } catch (error) {
    }
  };

  const handleRequestPermission = async () => {
    if (!permission) return;

    if (!permission.canAskAgain && !permission.granted) {
      Alert.alert(
        translations[language].permissionAlertTitle || 'Akses Kamera Diperlukan',
        translations[language].permissionDeniedMessage || 'Izin kamera ditolak. Silakan aktifkan izin kamera untuk Mentora AI di pengaturan perangkat Anda.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      translations[language].permissionAlertTitle || 'Akses Kamera Diperlukan',
      translations[language].permissionAlertMessage || 'Izinkan Mentora AI mengakses kamera Anda?',
      [
        {
          text: translations[language].cancelButton || 'Batal',
          style: 'cancel',
        },
        {
          text: translations[language].permissionButton || 'Izinkan',
          onPress: requestCameraPermission,
        },
      ]
    );
  };

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !hasAutoPrompted.current) {
      hasAutoPrompted.current = true;
      handleRequestPermission();
    }
  }, [permission]);

  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  const [tempImageUri, setTempImageUri] = useState(null);
  const [originalBase64, setOriginalBase64] = useState(null);
  const [croppedImageUri, setCroppedImageUri] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [originalWidth, setOriginalWidth] = useState(1);
  const [originalHeight, setOriginalHeight] = useState(1);
  const [displayWidth, setDisplayWidth] = useState(280);
  const [displayHeight, setDisplayHeight] = useState(280);

  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const scanAnim = useRef(new Animated.Value(0)).current;
  const touchState = useRef({
    activeHandle: null,
    startX: 0,
    startY: 0,
    startBox: null,
  });

  const onImageSelected = (uri, base64, w, h) => {
    setTempImageUri(uri);
    setOriginalBase64(base64);
    setIsCropping(true);

    const imgWidth = w || 1;
    const imgHeight = h || 1;
    setOriginalWidth(imgWidth);
    setOriginalHeight(imgHeight);

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height - 180; // Sisakan ruang untuk tombol aksi

    const imgRatio = imgWidth / imgHeight;
    const screenRatio = screenWidth / screenHeight;

    let dispW, dispH;
    if (imgRatio > screenRatio) {
      dispW = screenWidth;
      dispH = screenWidth / imgRatio;
    } else {
      dispH = screenHeight;
      dispW = screenHeight * imgRatio;
    }

    setDisplayWidth(dispW);
    setDisplayHeight(dispH);

    const cropW = dispW * 0.8;
    const cropH = dispH * 0.4;
    setCropBox({
      x: (dispW - cropW) / 2,
      y: (dispH - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo?.uri) {
        onImageSelected(photo.uri, photo.base64, photo.width, photo.height);
      }
    } catch (error) {
      alert("Gagal mengambil gambar: " + error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Izin akses galeri diperlukan!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      onImageSelected(asset.uri, asset.base64, asset.width, asset.height);
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setTempImageUri(null);
    setOriginalBase64(null);
  };

  const handleConfirmCrop = async () => {
    setIsCropping(false);
    setIsScanning(true);

    let finalUri = tempImageUri;
    let finalBase64 = originalBase64;

    try {
      const scale = originalWidth / displayWidth;
      const originX = Math.round(cropBox.x * scale);
      const originY = Math.round(cropBox.y * scale);
      const width = Math.round(cropBox.width * scale);
      const height = Math.round(cropBox.height * scale);

      if (ImageManipulator && typeof ImageManipulator.manipulate === 'function') {
        const context = ImageManipulator.manipulate(tempImageUri);
        context.crop({
          originX: Math.max(0, originX),
          originY: Math.max(0, originY),
          width: Math.min(originalWidth - originX, width),
          height: Math.min(originalHeight - originY, height),
        });
        const croppedImage = await context.renderAsync();
        const result = await croppedImage.saveAsync({
          compress: 0.8,
          format: SaveFormat.JPEG,
          base64: true,
        });
        finalUri = result.uri;
        finalBase64 = result.base64;
      }
    } catch (error) {
    }

    setCroppedImageUri(finalUri);

    scanAnim.setValue(0);
    Animated.timing(scanAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => {
      setIsScanning(false);
      if (finalBase64) {
        onImageScanned(finalUri, finalBase64);
      } else {
        alert("Gambar tidak ditemukan.");
      }
      setTempImageUri(null);
      setOriginalBase64(null);
      setCroppedImageUri(null);
    });
  };

  const handleTouchStart = (handle, e) => {
    const pageX = e.nativeEvent.pageX;
    const pageY = e.nativeEvent.pageY;
    touchState.current = {
      activeHandle: handle,
      startX: pageX,
      startY: pageY,
      startBox: { ...cropBox },
    };
  };

  const handleTouchMove = (e) => {
    const { activeHandle, startX, startY, startBox } = touchState.current;
    if (!activeHandle || !startBox) return;

    const dx = e.nativeEvent.pageX - startX;
    const dy = e.nativeEvent.pageY - startY;
    const minSize = 60;
    let newBox = { ...cropBox };

    switch (activeHandle) {
      case 'box':
        newBox = handleBoxMove(dx, dy, startBox, displayWidth, displayHeight);
        break;
      case 'topLeft':
        newBox = handleTopLeftMove(dx, dy, startBox, minSize);
        break;
      case 'topRight':
        newBox = handleTopRightMove(dx, dy, startBox, minSize, displayWidth);
        break;
      case 'bottomLeft':
        newBox = handleBottomLeftMove(dx, dy, startBox, minSize, displayHeight);
        break;
      case 'bottomRight':
        newBox = handleBottomRightMove(dx, dy, startBox, minSize, displayWidth, displayHeight);
        break;
    }

    setCropBox(newBox);
  };

  const handleTouchEnd = () => {
    touchState.current = {
      activeHandle: null,
      startX: 0,
      startY: 0,
      startBox: null,
    };
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#121214' : '#f0f9ff' }]}>
        <ActivityIndicator color="#0ea5e9" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <PermissionView
        isDark={isDark}
        language={language}
        onPermissionRequest={handleRequestPermission}
      />
    );
  }

  if (isScanning && croppedImageUri) {
    return (
      <ScanningView
        language={language}
        croppedImageUri={croppedImageUri}
        scanAnim={scanAnim}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CropModal
        visible={isCropping}
        onCancel={handleCancelCrop}
        onConfirm={handleConfirmCrop}
        displayWidth={displayWidth}
        displayHeight={displayHeight}
        tempImageUri={tempImageUri}
        cropBox={cropBox}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        enableTorch={isTorchOn}
      />

      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>{translations[language].scanQuestion}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconContainer} onPress={onShowHistory}>
            <Ionicons name="time-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewfinderContainer}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <View style={styles.crosshair}>
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />
          </View>
        </View>
        <Text style={styles.instructionText}>{translations[language].centerQuestion}</Text>
      </View>

      <View style={styles.footerOverlay}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={22} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shutterOuter}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={styles.shutterInner}>
            {isCapturing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.dotGrid}>
                <View style={styles.dotRow}>
                  <View style={styles.gridDot} /><View style={styles.gridDot} /><View style={styles.gridDot} />
                </View>
                <View style={styles.dotRow}>
                  <View style={styles.gridDot} /><View style={styles.gridDot} /><View style={styles.gridDot} />
                </View>
                <View style={styles.dotRow}>
                  <View style={styles.gridDot} /><View style={styles.gridDot} /><View style={styles.gridDot} />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isTorchOn ? styles.buttonActive : null]}
          onPress={() => setIsTorchOn(!isTorchOn)}
        >
          <Ionicons
            name={isTorchOn ? "flashlight" : "flashlight-outline"}
            size={22}
            color={isTorchOn ? '#000000' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f0f9ff',
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  permissionButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffffff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 4,
  },
  crosshair: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#ffffff',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#93c5fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotGrid: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  gridDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },

  cropContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  cropBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  cropImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  cropSubtext: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  cropFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropConfirmButtonCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  scanContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningCard: {
    width: '88%',
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
  },
  scanningTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  scanningImageContainer: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#030712',
    borderWidth: 1.5,
    borderColor: '#374151',
    position: 'relative',
  },
  scanningImage: {
    width: 280,
    height: 280,
    resizeMode: 'cover',
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
});

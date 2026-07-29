import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  useWindowDimensions,
  Dimensions,
  Animated,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../config/localization';
import { useAlert } from '../../config/AlertContext';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logoImage = require('../../assets/LOGO.jpeg');

const MessageItem = React.memo(({ item, isDark, isSearchActive, searchQuery, onImagePress, isActiveMatch }) => {
  const isUser = item.sender === 'user';
  const themeBubbleAi = isDark
    ? { backgroundColor: '#1e1e24', borderColor: '#27272a', borderWidth: Platform.OS === 'android' ? 1 : 0 }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: Platform.OS === 'android' ? 1 : 0 };
  const themeTextAi = isDark ? { color: '#e4e4e7' } : { color: '#0f172a' };

  const highlightSearchText = (text, isUser) => {
    if (!isSearchActive || !searchQuery.trim()) {
      return text;
    }
    const escapedQuery = searchQuery.replace(/[-\x2f\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const segments = text.split(regex);

    const segmentData = segments.map((segment, index) => ({
      id: `highlight-${index}-${segment.slice(0, 10)}`,
      content: segment,
      isMatch: regex.test(segment)
    }));

    return segmentData.map(segObj => {
      if (segObj.isMatch) {
        return (
          <Text
            key={segObj.id}
            style={isActiveMatch ? styles.highlightActive : (isUser ? styles.highlightUser : styles.highlightAi)}
          >
            {segObj.content}
          </Text>
        );
      }
      return segObj.content;
    });
  };

  const renderFormattedText = (text, isUser) => {
    if (!text) return null;

    const paragraphs = text.split('\n');
    const paragraphData = paragraphs.map((para, i) => {
      const parts = para.split(/\*\*([^*]+)\*\*/g);
      const partData = parts.map((part, partIdx) => ({
        id: `part-${partIdx}-${part.slice(0, 10)}`,
        content: part,
        isBold: partIdx % 2 === 1,
      }));

      return {
        id: `para-${i}-${para.slice(0, 10)}`,
        paraText: para,
        parts: partData,
      };
    });

    return paragraphData.map(pObj => {
      if (pObj.paraText.trim() === '---') {
        return <View key={pObj.id} style={[styles.markdownDivider, isDark ? { backgroundColor: '#27272a' } : null]} />;
      }

      return (
        <Text key={pObj.id} style={[styles.messageText, isUser ? styles.textUser : [styles.textAi, themeTextAi]]}>
          {pObj.parts.map(partObj => {
            if (partObj.isBold) {
              return (
                <Text key={partObj.id} style={styles.boldText}>
                  {highlightSearchText(partObj.content, isUser)}
                </Text>
              );
            }
            return highlightSearchText(partObj.content, isUser);
          })}
        </Text>
      );
    });
  };

  const pdfNameColor = (isUser || isDark) ? '#ffffff' : '#0f172a';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
      {!isUser && <Image source={logoImage} style={[styles.chatAvatarImage, isDark ? { borderColor: '#27272a' } : null]} />}
      <View style={[styles.messageBubble, isUser ? styles.bubbleUser : [styles.bubbleAi, themeBubbleAi]]}>
        {item.image && (() => {
          const imageList = item.image.split(',');
          return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {imageList.map((imgStr, idx) => {
                const trimmedImgStr = imgStr.trim();
                if (!trimmedImgStr) return null;
                const imageUri = (trimmedImgStr.startsWith('http') || trimmedImgStr.startsWith('file://') || trimmedImgStr.startsWith('content://') || trimmedImgStr.startsWith('data:'))
                  ? trimmedImgStr
                  : `data:image/jpeg;base64,${trimmedImgStr}`;
                const isSingle = imageList.length === 1;
                return (
                  <TouchableOpacity
                    key={`msg-img-${idx}`}
                    onPress={() => onImagePress(imageUri)}
                    activeOpacity={0.9}
                    style={isSingle ? null : { width: '47%', aspectRatio: 1 }}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={isSingle ? styles.messageImage : { width: '100%', height: '100%', borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })()}
        {item.pdf && (
          <View style={styles.pdfMessageCard}>
            <Ionicons name="document-text" size={32} color="#ef4444" />
            <View style={styles.pdfMessageInfo}>
              <Text style={[styles.pdfMessageName, { color: pdfNameColor }]} numberOfLines={1}>
                {item.pdfName || 'Document.pdf'}
              </Text>
              <Text style={[styles.pdfMessageSize, isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: '#64748b' }]}>
                {item.pdfSize || 'PDF'}
              </Text>
            </View>
          </View>
        )}
        {renderFormattedText(item.text, isUser)}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.item.pdf === nextProps.item.pdf &&
    prevProps.item.pdfName === nextProps.item.pdfName &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.isSearchActive === nextProps.isSearchActive &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});

function calculateNewCropBox({ activeHandle, startBox, dx, dy, displayWidth, displayHeight }) {
  const minSize = 60;
  let newBox = { ...startBox };

  if (activeHandle === 'box') {
    newBox.x = Math.max(0, Math.min(displayWidth - startBox.width, startBox.x + dx));
    newBox.y = Math.max(0, Math.min(displayHeight - startBox.height, startBox.y + dy));
  } else if (activeHandle === 'topLeft') {
    const newX = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + dx));
    const newY = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + dy));
    newBox.width = startBox.width + (startBox.x - newX);
    newBox.height = startBox.height + (startBox.y - newY);
    newBox.x = newX;
    newBox.y = newY;
  } else if (activeHandle === 'topRight') {
    const newY = Math.max(0, Math.min(startBox.y + startBox.height - minSize, startBox.y + dy));
    newBox.width = Math.max(minSize, Math.min(displayWidth - startBox.x, startBox.width + dx));
    newBox.height = startBox.height + (startBox.y - newY);
    newBox.y = newY;
  } else if (activeHandle === 'bottomLeft') {
    const newX = Math.max(0, Math.min(startBox.x + startBox.width - minSize, startBox.x + dx));
    newBox.width = startBox.width + (startBox.x - newX);
    newBox.height = Math.max(minSize, Math.min(displayHeight - startBox.y, startBox.height + dy));
    newBox.x = newX;
  } else if (activeHandle === 'bottomRight') {
    newBox.width = Math.max(minSize, Math.min(displayWidth - startBox.x, startBox.width + dx));
    newBox.height = Math.max(minSize, Math.min(displayHeight - startBox.y, startBox.height + dy));
  }

  return newBox;
}

function ScanningView({ croppedImageUri, scanAnim }) {
  return (
    <View style={styles.scanContainer}>
      <View style={styles.scanningCard}>
        <Text style={styles.scanningTitle}>Mentora AI is reading the question...</Text>
        <View style={styles.scanningImageContainer}>
          <Image source={{ uri: croppedImageUri }} style={styles.scanningImage} />
          <Animated.View
            style={[
              styles.laserLine,
              {
                transform: [{
                  translateX: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 276]
                  })
                }]
              }
            ]}
          />
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

        <View style={styles.cropWorkspace}>
          <View
            style={{ width: displayWidth, height: displayHeight, position: 'relative', overflow: 'hidden' }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {tempImageUri ? (
              <Image source={{ uri: tempImageUri }} style={{ width: displayWidth, height: displayHeight }} resizeMode="stretch" />
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

function getInitials(name) {
  if (!name) return 'M';
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : 'M';
}

function DrawerMenu({
  visible,
  onClose,
  themeDrawerContainer,
  themeDrawerHeader,
  themeDrawerText,
  themeDrawerMenuText,
  themeDrawerFooter,
  logoImage,
  language,
  user,
  onNewConversation,
  onShowHistory,
  onSearchPress,
  isDark,
}) {
  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    if (visible && user?.uid) {
      AsyncStorage.getItem(`profile_avatar_${user.uid}`).then(val => {
        if (val) {
          setAvatarUri(val);
        } else if (user.photoURL) {
          setAvatarUri(user.photoURL);
        } else {
          setAvatarUri(null);
        }
      }).catch(err => {
        setAvatarUri(null);
      });
    }
  }, [visible, user]);

  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.drawerBackdrop}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.drawerContainer, themeDrawerContainer]}>
            <View style={[styles.drawerHeader, themeDrawerHeader]}>
              <View style={styles.drawerLogoContainer}>
                <Image source={logoImage} style={styles.drawerLogo} />
                <Text style={[styles.drawerLogoText, themeDrawerText]}>Mentora AI</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.drawerCloseButton}>
                <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerMenu}>
              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  onClose();
                  onNewConversation();
                }}
              >
                <Ionicons name="create-outline" size={22} color={isDark ? "#a1a1aa" : "#64748b"} style={styles.menuIcon} />
                <Text style={[styles.menuText, themeDrawerMenuText]}>{translations[language].newConversation}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  onClose();
                  onSearchPress();
                }}
              >
                <Ionicons name="search-outline" size={22} color={isDark ? "#a1a1aa" : "#64748b"} style={styles.menuIcon} />
                <Text style={[styles.menuText, themeDrawerMenuText]}>{translations[language].searchConversation}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerMenuItem}
                onPress={() => {
                  onClose();
                  onShowHistory();
                }}
              >
                <Ionicons name="time-outline" size={22} color={isDark ? "#a1a1aa" : "#64748b"} style={styles.menuIcon} />
                <Text style={[styles.menuText, themeDrawerMenuText]}>{translations[language].history}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.drawerFooter, themeDrawerFooter]}>
              <View style={styles.userProfileContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.userAvatar} />
                ) : (
                  <View style={[styles.userAvatar, { backgroundColor: isDark ? '#27272a' : '#0ea5e9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#3f3f46' : '#e2e8f0' }]}>
                    <Text style={{ color: isDark ? '#e4e4e7' : '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
                      {getInitials(user?.displayName || user?.providerData?.[0]?.displayName || (language === 'id' ? 'Pengguna Mentora' : 'Mentora User'))}
                    </Text>
                  </View>
                )}
                <View style={styles.userTextContainer}>
                  <Text style={[styles.userDisplayName, themeDrawerText]} numberOfLines={1}>
                    {user?.displayName || user?.providerData?.[0]?.displayName || (language === 'id' ? 'Pengguna Mentora' : 'Mentora User')}
                  </Text>
                  <Text style={[styles.userSubtitle, isDark ? { color: '#a1a1aa' } : null]} numberOfLines={1}>
                    {user?.email || user?.providerData?.[0]?.email || ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

function ImagePreviewModal({ visible, imageUri, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.imageModalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.imageModalContainer}>
              <Image source={{ uri: imageUri }} style={styles.imageModalFull} resizeMode="contain" />
              <TouchableOpacity
                onPress={onClose}
                style={styles.imageModalCloseButton}
              >
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const LIGHT_THEME = {
  container: { backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#ffffff', borderBottomColor: '#f1f5f9' },
  headerText: { color: '#0f172a' },
  inputContainer: { backgroundColor: '#ffffff', borderTopColor: '#f1f5f9' },
  input: { backgroundColor: '#f1f5f9', color: '#0f172a' },
  searchContainer: { backgroundColor: '#ffffff', borderBottomColor: '#f1f5f9' },
  drawerContainer: { backgroundColor: '#ffffff' },
  drawerHeader: { borderBottomColor: '#f1f5f9' },
  drawerText: { color: '#0f172a' },
  drawerMenuText: { color: '#334155' },
  drawerFooter: { borderTopColor: '#f1f5f9' },
  iconColor: "#0f172a",
  subTextIconColor: "#64748b",
  thinkingText: null,
  pdfPreviewName: { color: '#0f172a' },
  attachmentPanel: { backgroundColor: '#f1f5f9', borderTopColor: '#e2e8f0' },
  attachmentCard: { backgroundColor: '#ffffff' },
  attachmentCardText: { color: '#334155' },
};

const DARK_THEME = {
  container: { backgroundColor: '#121214' },
  header: { backgroundColor: '#1e1e24', borderBottomColor: '#27272a' },
  headerText: { color: '#ffffff' },
  inputContainer: { backgroundColor: '#1e1e24', borderTopColor: '#27272a' },
  input: { backgroundColor: '#27272a', color: '#ffffff' },
  searchContainer: { backgroundColor: '#1e1e24', borderBottomColor: '#27272a' },
  drawerContainer: { backgroundColor: '#1e1e24' },
  drawerHeader: { borderBottomColor: '#27272a' },
  drawerText: { color: '#ffffff' },
  drawerMenuText: { color: '#e4e4e7' },
  drawerFooter: { borderTopColor: '#27272a' },
  iconColor: "#ffffff",
  subTextIconColor: "#ffffff",
  thinkingText: { color: '#a1a1aa' },
  pdfPreviewName: { color: '#ffffff' },
  attachmentPanel: { backgroundColor: '#1e1e24', borderTopColor: '#27272a' },
  attachmentCard: { backgroundColor: '#27272a' },
  attachmentCardText: { color: '#e4e4e7' },
};

function getThemeStyles(isDark) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

function ChatHeader({ isSearchActive, theme, onMenuPress, onSearchToggle }) {
  return (
    <View style={[styles.headerBar, theme.header]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.headerIconContainer}>
        <Ionicons name="menu" size={24} color={theme.iconColor} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, theme.headerText]}>Mentora AI</Text>
      <TouchableOpacity onPress={onSearchToggle} style={styles.headerIconContainer}>
        <Ionicons name={isSearchActive ? "close-outline" : "search-outline"} size={24} color={theme.iconColor} />
      </TouchableOpacity>
    </View>
  );
}

function SearchBar({ show, theme, searchInputRef, language, value, onChange, onNext, onPrev, currentMatch, matchCount }) {
  if (!show) return null;
  return (
    <View style={[styles.searchBarContainer, theme.searchContainer, { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, theme.input, { paddingRight: value.trim().length > 0 ? 80 : 16 }]}
          placeholder={translations[language].searchConversation}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChange}
          autoFocus
        />
      </View>
      {value.trim().length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4 }}>
          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>
            {matchCount > 0 ? `${currentMatch}/${matchCount}` : '0/0'}
          </Text>
          <TouchableOpacity onPress={onPrev} disabled={matchCount === 0} style={{ padding: 6, opacity: matchCount === 0 ? 0.4 : 1 }}>
            <Ionicons name="chevron-back" size={20} color={theme.iconColor || '#0f172a'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} disabled={matchCount === 0} style={{ padding: 6, opacity: matchCount === 0 ? 0.4 : 1 }}>
            <Ionicons name="chevron-forward" size={20} color={theme.iconColor || '#0f172a'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ChatLoadingView({ loading, theme, language }) {
  if (!loading) return null;
  return (
    <View style={styles.chatLoadingContainer}>
      <ActivityIndicator color="#0ea5e9" size="small" />
      <Text style={[styles.chatLoadingText, theme.thinkingText]}>
        {translations[language].thinking}
      </Text>
    </View>
  );
}

function AttachmentPreview({ attachment, theme, onImagePress, onRemove }) {
  if (!attachment) return null;
  const list = Array.isArray(attachment) ? attachment : [attachment];
  if (list.length === 0) return null;

  return (
    <View style={styles.attachmentPreviewContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingVertical: 4 }}
      >
        {list.map((item, index) => (
          <View key={`attach-${index}`} style={styles.attachmentPreviewWrapper}>
            {item.type === 'image' ? (
              <TouchableOpacity onPress={() => onImagePress(item.uri)} activeOpacity={0.9}>
                <Image source={{ uri: item.uri }} style={styles.attachmentPreviewImage} />
              </TouchableOpacity>
            ) : (
              <View style={styles.attachmentPreviewPdfCard}>
                <Ionicons name="document-text" size={28} color="#ef4444" />
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <Text style={[styles.attachmentPreviewPdfName, theme.pdfPreviewName]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.attachmentPreviewPdfSize}>
                    {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'PDF'}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeAttachmentButton}
              onPress={() => onRemove(index)}
            >
              <Ionicons name="close" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function AttachmentPanel({ show, theme, keyboardVisible, onGallery, onCamera, onPdf }) {
  if (!show) return null;
  return (
    <View style={[
      styles.attachmentPanel,
      theme.attachmentPanel,
      { marginBottom: keyboardVisible ? 0 : 60 }
    ]}>
      <TouchableOpacity
        style={[styles.attachmentCard, theme.attachmentCard]}
        onPress={onGallery}
      >
        <Ionicons name="image-outline" size={24} color="#0ea5e9" />
        <Text style={[styles.attachmentCardText, theme.attachmentCardText]}>Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.attachmentCard, theme.attachmentCard]}
        onPress={onCamera}
      >
        <Ionicons name="camera-outline" size={24} color="#0ea5e9" />
        <Text style={[styles.attachmentCardText, theme.attachmentCardText]}>Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.attachmentCard, theme.attachmentCard]}
        onPress={onPdf}
      >
        <Ionicons name="document-text-outline" size={24} color="#0ea5e9" />
        <Text style={[styles.attachmentCardText, theme.attachmentCardText]}>PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

function useChatStateAndHandlers({
  messages,
  chatLoading,
  onSendMessage,
  onNewConversation,
  onShowHistory,
  onCancelThinking,
  user,
  language,
  isDark
}) {
  const { showAlert } = useAlert();
  const flatListRef = useRef();
  const chatInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const getMatchIndexes = useCallback(() => {
    if (!isSearchActive || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const idxs = [];
    messages.forEach((msg, idx) => {
      if (msg.text && msg.text.toLowerCase().includes(query)) {
        idxs.push(idx);
      }
    });
    return idxs;
  }, [isSearchActive, searchQuery, messages]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const handleSearchNext = () => {
    const matchIndexes = getMatchIndexes();
    if (matchIndexes.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matchIndexes.length;
    setCurrentMatchIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: matchIndexes[nextIndex], animated: true, viewPosition: 0.5 });
  };

  const handleSearchPrev = () => {
    const matchIndexes = getMatchIndexes();
    if (matchIndexes.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matchIndexes.length) % matchIndexes.length;
    setCurrentMatchIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: matchIndexes[prevIndex], animated: true, viewPosition: 0.5 });
  };

  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = Dimensions.get('screen').height;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);

  const addAttachment = (newAttach) => {
    setAttachment(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      return [...currentList, newAttach];
    });
  };

  const handleRemoveAttachment = (index) => {
    setAttachment(prev => {
      if (!Array.isArray(prev)) return null;
      const newList = prev.filter((_, i) => i !== index);
      return newList.length > 0 ? newList : null;
    });
  };

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
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

    const imgW = w || 1;
    const imgH = h || 1;
    setOriginalWidth(imgW);
    setOriginalHeight(imgH);

    const screenWidth = Dimensions.get('window').width;
    const maxCropHeight = Dimensions.get('window').height - 180;

    let dispW = screenWidth;
    let dispH = screenWidth * (imgH / imgW);

    if (dispH > maxCropHeight) {
      dispH = maxCropHeight;
      dispW = maxCropHeight * (imgW / imgH);
    }

    setDisplayWidth(dispW);
    setDisplayHeight(dispH);

    const cropW = dispW * 0.85;
    const cropH = dispH * 0.55;
    setCropBox({
      x: (dispW - cropW) / 2,
      y: (dispH - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  };

  const handleGallerySelect = async () => {
    setShowAttachmentMenu(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert({
        title: language === 'id' ? 'Akses Ditolak' : 'Access Denied',
        message: language === 'id' ? 'Izin akses galeri diperlukan!' : 'Gallery access is required!',
        type: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets) {
      if (result.assets.length === 1) {
        const asset = result.assets[0];
        let base64 = asset.base64;
        if (!base64) {
          try {
            base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType?.Base64 || 'base64',
            });
          } catch (err) {
          }
        }
        onImageSelected(asset.uri, base64, asset.width, asset.height);
      } else {
        for (const asset of result.assets) {
          let base64 = asset.base64;
          if (!base64) {
            try {
              base64 = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType?.Base64 || 'base64',
              });
            } catch (err) {
            }
          }
          addAttachment({
            type: 'image',
            uri: asset.uri,
            base64: base64,
          });
        }
      }
    }
  };

  const handleCameraSelect = async () => {
    setShowAttachmentMenu(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert({
        title: language === 'id' ? 'Akses Ditolak' : 'Access Denied',
        message: language === 'id' ? 'Izin akses kamera diperlukan!' : 'Camera access is required!',
        type: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      let base64 = asset.base64;
      if (!base64) {
        try {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
        } catch (err) {
        }
      }
      onImageSelected(asset.uri, base64, asset.width, asset.height);
    }
  };

  const handlePdfSelect = async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });
        addAttachment({
          type: 'pdf',
          uri: asset.uri,
          base64: base64,
          name: asset.name,
          size: asset.size,
        });
      }
    } catch (err) {
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
        const imageRef = await context.renderAsync();
        const croppedImage = await imageRef.saveAsync({
          compress: 0.8,
          format: SaveFormat.JPEG,
          base64: true,
        });
        finalUri = croppedImage.uri;
        finalBase64 = croppedImage.base64;
      }
    } catch (error) {
    }

    if (finalUri && !finalBase64) {
      try {
        finalBase64 = await FileSystem.readAsStringAsync(finalUri, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });
      } catch (err) {
      }
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
        addAttachment({
          type: 'image',
          uri: finalUri,
          base64: finalBase64,
        });
      } else {
        showAlert({
          title: 'Error',
          message: language === 'id' ? 'Gambar tidak ditemukan.' : 'Image not found.',
          type: 'error',
        });
      }
      setTempImageUri(null);
      setOriginalBase64(null);
      setCroppedImageUri(null);
    });
  };

  const handleSendPress = () => {
    onSendMessage(inputText, attachment);
    setInputText('');
    setAttachment(null);
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

    const pageX = e.nativeEvent.pageX;
    const pageY = e.nativeEvent.pageY;

    const dx = pageX - startX;
    const dy = pageY - startY;

    const newBox = calculateNewCropBox({
      activeHandle,
      startBox,
      dx,
      dy,
      displayWidth,
      displayHeight,
    });

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

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages, chatLoading]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const isVisible = windowHeight < screenHeight - 150;
      setKeyboardVisible(isVisible);
    }
  }, [windowHeight, screenHeight]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        if (Platform.OS === 'android') {
          chatInputRef.current?.blur();
          searchInputRef.current?.blur();
        }
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const renderMessageItem = useCallback(({ item, index }) => {
    const matchIndexes = getMatchIndexes();
    const isActiveMatch = isSearchActive && matchIndexes.length > 0 && matchIndexes[currentMatchIndex] === index;
    return (
      <MessageItem
        item={item}
        isDark={isDark}
        isSearchActive={isSearchActive}
        searchQuery={searchQuery}
        onImagePress={setSelectedImage}
        isActiveMatch={isActiveMatch}
      />
    );
  }, [isDark, isSearchActive, searchQuery, currentMatchIndex, messages, getMatchIndexes]);

  const getFilteredMessages = () => {
    return messages;
  };

  const handleSearchToggle = () => {
    if (isSearchActive) {
      setSearchQuery('');
    }
    setIsSearchActive(!isSearchActive);
  };

  return {
    flatListRef,
    chatInputRef,
    searchInputRef,
    isDrawerOpen,
    setIsDrawerOpen,
    isSearchActive,
    setIsSearchActive,
    searchQuery,
    setSearchQuery,
    keyboardVisible,
    currentMatchIndex,
    handleSearchNext,
    handleSearchPrev,
    matchCount: getMatchIndexes().length,
    selectedImage,
    setSelectedImage,
    inputText,
    setInputText,
    attachment,
    setAttachment,
    handleRemoveAttachment,
    showAttachmentMenu,
    setShowAttachmentMenu,
    tempImageUri,
    croppedImageUri,
    isCropping,
    isScanning,
    displayWidth,
    displayHeight,
    cropBox,
    scanAnim,
    handleGallerySelect,
    handleCameraSelect,
    handlePdfSelect,
    handleCancelCrop,
    handleConfirmCrop,
    handleSendPress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    renderMessageItem,
    getFilteredMessages,
    handleSearchToggle
  };
}

export default function ChatTab({
  messages,
  chatLoading,
  onSendMessage,
  onNewConversation,
  onShowHistory,
  onCancelThinking,
  user,
  language,
  isDark
}) {
  const theme = getThemeStyles(isDark);
  const isIos = Platform.OS === 'ios';
  const keyboardBehavior = isIos ? 'padding' : 'height';
  const keyboardOffset = isIos ? 90 : 60;

  const {
    flatListRef,
    chatInputRef,
    searchInputRef,
    isDrawerOpen,
    setIsDrawerOpen,
    isSearchActive,
    setIsSearchActive,
    searchQuery,
    setSearchQuery,
    keyboardVisible,
    currentMatchIndex,
    handleSearchNext,
    handleSearchPrev,
    matchCount,
    selectedImage,
    setSelectedImage,
    inputText,
    setInputText,
    attachment,
    setAttachment,
    handleRemoveAttachment,
    showAttachmentMenu,
    setShowAttachmentMenu,
    tempImageUri,
    croppedImageUri,
    isCropping,
    isScanning,
    displayWidth,
    displayHeight,
    cropBox,
    scanAnim,
    handleGallerySelect,
    handleCameraSelect,
    handlePdfSelect,
    handleCancelCrop,
    handleConfirmCrop,
    handleSendPress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    renderMessageItem,
    getFilteredMessages,
    handleSearchToggle
  } = useChatStateAndHandlers({
    messages,
    chatLoading,
    onSendMessage,
    onNewConversation,
    onShowHistory,
    onCancelThinking,
    user,
    language,
    isDark
  });

  if (isScanning && croppedImageUri) {
    return <ScanningView croppedImageUri={croppedImageUri} scanAnim={scanAnim} />;
  }

  return (
    <KeyboardAvoidingView
      enabled={isIos ? true : keyboardVisible}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={keyboardOffset}
      style={[styles.chatContainer, theme.container]}
    >
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

      <ChatHeader
        isSearchActive={isSearchActive}
        theme={theme}
        onMenuPress={() => setIsDrawerOpen(true)}
        onSearchToggle={handleSearchToggle}
      />

      <SearchBar
        show={isSearchActive}
        theme={theme}
        searchInputRef={searchInputRef}
        language={language}
        value={searchQuery}
        onChange={setSearchQuery}
        onNext={handleSearchNext}
        onPrev={handleSearchPrev}
        currentMatch={currentMatchIndex + 1}
        matchCount={matchCount}
      />

      <FlatList
        ref={flatListRef}
        data={getFilteredMessages()}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatListContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
          }, 100);
        }}
      />

      <ChatLoadingView
        loading={chatLoading}
        theme={theme}
        language={language}
      />

      <View style={[styles.inputAreaWrapper, theme.inputContainer, { marginBottom: showAttachmentMenu || keyboardVisible ? 0 : 80 }]}>
        <AttachmentPreview
          attachment={attachment}
          theme={theme}
          onImagePress={setSelectedImage}
          onRemove={handleRemoveAttachment}
        />
        <View style={styles.inputContainerRow}>
          <TouchableOpacity
            style={styles.attachmentToggleButton}
            onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
          >
            <Ionicons
              name={showAttachmentMenu ? "close" : "add-outline"}
              size={24}
              color={theme.subTextIconColor}
            />
          </TouchableOpacity>
          <TextInput
            ref={chatInputRef}
            style={[styles.chatInput, theme.input]}
            placeholder={translations[language].writeQuestion}
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            editable={!chatLoading}
          />
          {chatLoading ? (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: '#ef4444' }]}
              onPress={onCancelThinking}
            >
              <Ionicons name="square" size={14} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() && !attachment) ? styles.sendButtonDisabled : null]}
              onPress={handleSendPress}
              disabled={!inputText.trim() && !attachment}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <AttachmentPanel
        show={showAttachmentMenu}
        theme={theme}
        keyboardVisible={keyboardVisible}
        onGallery={handleGallerySelect}
        onCamera={handleCameraSelect}
        onPdf={handlePdfSelect}
      />

      <DrawerMenu
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        themeDrawerContainer={theme.drawerContainer}
        themeDrawerHeader={theme.drawerHeader}
        themeDrawerText={theme.drawerText}
        themeDrawerMenuText={theme.drawerMenuText}
        themeDrawerFooter={theme.drawerFooter}
        logoImage={logoImage}
        language={language}
        user={user}
        onNewConversation={onNewConversation}
        onShowHistory={onShowHistory}
        onSearchPress={() => setIsSearchActive(true)}
        isDark={isDark}
      />

      <ImagePreviewModal
        visible={!!selectedImage}
        imageUri={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerIconContainer: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchBarContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#0f172a',
    fontSize: 14,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  chatAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  bubbleUser: {
    backgroundColor: '#0ea5e9',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  textUser: {
    color: '#ffffff',
  },
  textAi: {
    color: '#0f172a',
  },
  boldText: {
    fontWeight: 'bold',
  },
  highlightAi: {
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  highlightUser: {
    backgroundColor: '#ffffff',
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  highlightActive: {
    backgroundColor: '#eab308',
    color: '#000000',
    fontWeight: 'bold',
  },
  markdownDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
    width: '100%',
  },
  chatLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  chatLoadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  inputAreaWrapper: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentPreviewContainer: {
    marginBottom: 10,
    width: '100%',
  },
  attachmentPreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'visible',
  },
  attachmentPreviewImage: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attachmentPreviewPdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    width: 180,
  },
  attachmentPreviewPdfName: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  chatInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 18,
    color: '#0f172a',
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  drawerContainer: {
    width: 290,
    height: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  drawerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  drawerLogoText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerCloseButton: {
    padding: 4,
  },
  drawerMenu: {
    flex: 1,
    gap: 16,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userTextContainer: {
    flex: 1,
  },
  userDisplayName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  settingsButton: {
    padding: 8,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModalContainer: {
    width: '85%',
    height: 250,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsCloseButton: {
    padding: 4,
  },
  settingsContent: {
    flex: 1,
    padding: 24,
  },
  settingsContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  settingsRowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settingsRowValueText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  appDropdownMenu: {
    position: 'absolute',
    right: 24,
    top: 92,
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  langDropdownMenu: {
    position: 'absolute',
    right: 24,
    top: 142,
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  langDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  langDropdownText: {
    fontSize: 13,
    color: '#334155',
  },
  langDropdownTextActive: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageModalFull: {
    width: '90%',
    height: '80%',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentToggleButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPanel: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  attachmentCard: {
    width: 74,
    height: 74,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  attachmentCardText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pdfMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 10,
    marginBottom: 8,
    gap: 10,
    width: 200,
  },
  pdfMessageInfo: {
    flex: 1,
  },
  pdfMessageName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pdfMessageSize: {
    fontSize: 10,
    marginTop: 2,
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
  cropContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  cropBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  cropWorkspace: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { LANGUAGES, LANGUAGE_PAIRS } from '../constants/languages';
import { translateText } from '../services/translateService';

export default function HomeScreen() {
  const [langPair, setLangPair] = useState('hy_ru');
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const transcriptRef = useRef('');
  const isProcessingRef = useRef(false);

  const pair = LANGUAGE_PAIRS[langPair];
  const sourceLang = LANGUAGES[pair.source];
  const targetLang = LANGUAGES[pair.target];

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setRecognizedText('');
    setTranslatedText('');
    transcriptRef.current = '';
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      const text = event.results[0].transcript;
      transcriptRef.current = text;
      setRecognizedText(text);

      if (event.isFinal && text) {
        processTranslation(text);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      Alert.alert('Recognition Error', event.message || event.error);
    }
  });

  const processTranslation = async (text) => {
    if (!text || text.trim().length === 0 || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsTranslating(true);

    try {
      const result = await translateText(text.trim(), pair.source, pair.target);
      setTranslatedText(result);

      if (autoSpeak && result) {
        Speech.speak(result, { language: targetLang.ttsLocale });
      }
    } catch (error) {
      Alert.alert('Translation Error', error.message);
    } finally {
      setIsTranslating(false);
      isProcessingRef.current = false;
    }
  };

  const toggleLangPair = useCallback(() => {
    if (isListening) return;
    Speech.stop();
    ExpoSpeechRecognitionModule.abort();
    setLangPair(prev => (prev === 'hy_ru' ? 'ru_hy' : 'hy_ru'));
    setRecognizedText('');
    setTranslatedText('');
  }, [isListening]);

  const startListening = useCallback(async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required for voice translation.');
        return;
      }
      Speech.stop();
      ExpoSpeechRecognitionModule.start({
        lang: sourceLang.speechLocale,
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      Alert.alert('Error', `Failed to start: ${error.message}`);
    }
  }, [sourceLang]);

  const stopListening = useCallback(async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (_) {}
  }, []);

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleMicRelease = useCallback(() => {
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  useEffect(() => {
    return () => {
      Speech.stop();
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Translator</Text>
        <Text style={styles.subtitle}>Armenian ↔ Russian</Text>
      </View>

      <TouchableOpacity style={styles.langToggle} onPress={toggleLangPair} disabled={isListening}>
        <Text style={styles.langToggleText}>{pair.label}</Text>
        <Text style={styles.langToggleIcon}>⇄</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setAutoSpeak(!autoSpeak)} style={styles.autoSpeakBtn}>
        <Text style={styles.autoSpeakText}>Auto-speak: {autoSpeak ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>

      <View style={styles.translationBox}>
        <Text style={styles.langLabel}>{sourceLang.nativeName} (recognized)</Text>
        <View style={styles.textBox}>
          <Text style={styles.textContent}>{recognizedText || 'Waiting for speech...'}</Text>
        </View>
      </View>

      <View style={styles.translationBox}>
        <Text style={styles.langLabel}>{targetLang.nativeName} (translation)</Text>
        <View style={styles.textBox}>
          <Text style={styles.textContent}>
            {isTranslating ? 'Translating...' : translatedText || 'Translation will appear here'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.micButton, isListening && styles.micButtonActive]}
        onPressIn={handleMicPress}
        onPressOut={handleMicRelease}
        activeOpacity={0.7}
      >
        <Text style={styles.micIcon}>{isListening ? '🔴' : '🎤'}</Text>
        <Text style={styles.micLabel}>
          {isListening ? 'Listening...' : isTranslating ? 'Translating...' : 'Tap & hold to speak'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  langToggleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  langToggleIcon: {
    fontSize: 20,
    marginLeft: 10,
    color: '#6C63FF',
  },
  autoSpeakBtn: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  autoSpeakText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  translationBox: {
    marginBottom: 12,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 70,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textContent: {
    fontSize: 16,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  micButton: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micButtonActive: {
    backgroundColor: '#FF4757',
    transform: [{ scale: 1.1 }],
  },
  micIcon: {
    fontSize: 36,
  },
  micLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
  },
});

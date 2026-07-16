import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { LANGUAGES, LANGUAGE_PAIRS } from '../constants/languages';
import { translateText } from '../services/translateService';

async function speakArmenian(text) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      {
        uri: `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=hy&client=gtx`,
      },
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {
    Alert.alert('TTS Error', 'Could not play Armenian audio. Make sure you have internet.');
  }
}

export default function HomeScreen() {
  const [langPair, setLangPair] = useState('hy_ru');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const pair = LANGUAGE_PAIRS[langPair];
  const sourceLang = LANGUAGES[pair.source];
  const targetLang = LANGUAGES[pair.target];

  const toggleLangPair = useCallback(() => {
    Speech.stop();
    setLangPair(prev => (prev === 'hy_ru' ? 'ru_hy' : 'hy_ru'));
    setInputText('');
    setTranslatedText('');
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateText(inputText.trim(), pair.source, pair.target);
      setTranslatedText(result);
      if (autoSpeak && result) {
        if (pair.target === 'ru') {
          Speech.speak(result, { language: 'ru' });
        } else {
          speakArmenian(result);
        }
      }
    } catch (error) {
      Alert.alert('Translation Error', error.message);
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, pair, autoSpeak]);

  const speakSource = useCallback(() => {
    if (!inputText.trim()) return;
    if (pair.source === 'ru') {
      Speech.speak(inputText, { language: 'ru' });
    } else {
      speakArmenian(inputText);
    }
  }, [inputText, pair]);

  const speakTarget = useCallback(() => {
    if (!translatedText.trim()) return;
    if (pair.target === 'ru') {
      Speech.speak(translatedText, { language: 'ru' });
    } else {
      speakArmenian(translatedText);
    }
  }, [translatedText, pair]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Translator</Text>
        <Text style={styles.subtitle}>Armenian ↔ Russian</Text>
      </View>

      <TouchableOpacity style={styles.langToggle} onPress={toggleLangPair}>
        <Text style={styles.langToggleText}>{pair.label}</Text>
        <Text style={styles.langToggleIcon}>⇄</Text>
      </TouchableOpacity>

      <View style={styles.inputSection}>
        <Text style={styles.langLabel}>{sourceLang.nativeName}</Text>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Type in ${sourceLang.name}...`}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.speakBtn} onPress={speakSource}>
          <Text style={styles.speakBtnText}>🔊 Speak</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.translateBtn}
        onPress={handleTranslate}
        disabled={isTranslating || !inputText.trim()}
      >
        <Text style={styles.translateBtnText}>
          {isTranslating ? 'Translating...' : 'Translate ↓'}
        </Text>
      </TouchableOpacity>

      <View style={styles.outputSection}>
        <Text style={styles.langLabel}>{targetLang.nativeName}</Text>
        <View style={styles.textOutput}>
          <Text style={styles.outputText}>
            {translatedText || 'Translation will appear here'}
          </Text>
        </View>
        {translatedText ? (
          <TouchableOpacity style={styles.speakBtn} onPress={speakTarget}>
            <Text style={styles.speakBtnText}>🔊 Speak</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity style={styles.autoSpeakBtn} onPress={() => setAutoSpeak(!autoSpeak)}>
        <Text style={styles.autoSpeakText}>Auto-speak: {autoSpeak ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F5F7FA',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  langToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 12, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  langToggleText: { fontSize: 18, fontWeight: '600', color: '#1A1A2E' },
  langToggleIcon: { fontSize: 20, marginLeft: 10, color: '#6C63FF' },
  inputSection: { marginBottom: 12 },
  langLabel: {
    fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    minHeight: 100, fontSize: 16, color: '#1A1A2E', lineHeight: 22,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  speakBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 14, marginTop: 6 },
  speakBtnText: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  translateBtn: {
    backgroundColor: '#6C63FF', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginVertical: 12,
    elevation: 2, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  translateBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outputSection: { marginBottom: 12 },
  textOutput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, minHeight: 70,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  outputText: { fontSize: 16, color: '#1A1A2E', lineHeight: 22 },
  autoSpeakBtn: {
    alignSelf: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8,
    paddingHorizontal: 16, borderRadius: 8, elevation: 1,
  },
  autoSpeakText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
});

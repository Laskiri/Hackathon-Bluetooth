import React, { useState, useRef, useEffect } from 'react';
import { Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { QUIZ_DATA } from '@/constants/quiz';
import { ARTIFACTS } from '@/constants/artifacts';

export default function QuizScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  const question = QUIZ_DATA.questions[index];
  const correctColor = useThemeColor({}, 'correctAnswer');
  const incorrectColor = useThemeColor({}, 'incorrectAnswer');
  const selectedColor = useThemeColor({}, 'selectedAnswer');
  const cardBackground = useThemeColor({}, 'cardBackground');

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, [index, scale]);

  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(() => new Set<string>());
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function onSelectAnswer(answerId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelected(answerId);

    const correct = answerId === question.correctAnswerId;
    if (correct) {
      setIsCorrect(true);
      setScore(s => s + 5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // visual feedback then auto-advance
      setTimeout(() => {
        setIsCorrect(null);
        setSelected(null);
        setWrongAnswers(new Set<string>());
        setIsProcessing(false);
        if (index + 1 >= QUIZ_DATA.questions.length) {
          router.push('./result');
        } else {
          setIndex(i => i + 1);
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.05, duration: 120, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]).start();
        }
      }, 1500);
    } else {
      // incorrect: mark and allow retry
      setWrongAnswers(prev => {
        const next = new Set(prev);
        next.add(answerId);
        return next;
      });
      setScore((prev) => score > 0 ? prev - 1 : 0)
      setIsCorrect(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // allow immediate retry
      setIsProcessing(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <ThemedText type="title">Quiz</ThemedText>
        <ThemedText>{`Question ${index + 1} of ${QUIZ_DATA.questions.length}`}</ThemedText>
        {question.artifactId ? (
          <ThemedText>{ARTIFACTS.find(a => a.id === question.artifactId)?.name ?? ''}</ThemedText>
        ) : null}
        <ThemedText>{`Score: ${score}`}</ThemedText>
      </Animated.View>

      <View style={styles.questionBox}>
        <ThemedText type="subtitle" style={[{marginBottom: 32}]}>{question.question}</ThemedText>
        <FlatList
          data={question.answers}
          keyExtractor={a => a.id}
          renderItem={({ item }) => {
            const isSelected = selected === item.id;
            const isWrong = wrongAnswers.has(item.id);
            const backgroundColor = isWrong
              ? incorrectColor
              : isSelected && isCorrect === true
              ? correctColor
              : isSelected && isCorrect === null
              ? selectedColor
              : cardBackground;
            return (
              <TouchableOpacity
                style={[styles.answerRow, { backgroundColor }]}
                onPress={() => onSelectAnswer(item.id)}
              >
                <ThemedText>{item.text}</ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* controls removed — progression is automatic on correct answers */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  questionBox: { marginTop: 16 },
  answerRow: { padding: 12, borderRadius: 8, marginVertical: 6 },
  controls: { marginTop: 20, alignItems: 'center' },
});

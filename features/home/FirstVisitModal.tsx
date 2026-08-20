import React, { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../settings/ThemeContext';
import { uiRadii } from '../shared/uiPrimitives';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const SLIDES = [
  {
    icon: 'school' as MaterialIconName,
    color: '#4EA7F5',
    bg: '#EBF5FF',
    bgDark: '#0D2742',
    title: 'Bienvenue sur Ellie !',
    body: "Ton assistant pour les cours d’anglais. Utilise Ellie en complément de tes leçons pour t’entraîner sur ce que tu as appris.",
  },
  {
    icon: 'edit' as MaterialIconName,
    color: '#4EA7F5',
    bg: '#EBF5FF',
    bgDark: '#0D2742',
    title: 'Grammaire',
    body: 'Complète les blancs, remets les phrases dans l’ordre, choisis la bonne réponse, ou traduis — tes réponses sont enregistrées automatiquement.',
  },
  {
    icon: 'style' as MaterialIconName,
    color: '#35C8B5',
    bg: '#E6FAF8',
    bgDark: '#092B28',
    title: 'Vocabulaire',
    body: 'Révise les mots avec des flashcards, associe-les dans le jeu de memory, ou tape la traduction pour te mettre au défi.',
  },
  {
    icon: 'workspace-premium' as MaterialIconName,
    color: '#F4B942',
    bg: '#FFF8E6',
    bgDark: '#2C2000',
    title: 'Suis ta progression',
    body: 'Gagne des XP et garde ta série de jours actifs. Crée un compte gratuit pour débloquer des photos de profil et sauvegarder ta progression.',
  },
];

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSetupAccount: () => void;
};

export default function FirstVisitModal({ visible, onDismiss, onSetupAccount }: Props) {
  const { colors, isDarkMode } = useTheme();
  const [slide, setSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isLast = slide === SLIDES.length - 1;

  const goToSlide = (next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setSlide(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 170, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      goToSlide(slide + 1);
    }
  };

  const handleSetupAccount = () => {
    onDismiss();
    onSetupAccount();
  };

  const current = SLIDES[slide];
  const iconBg = isDarkMode ? current.bgDark : current.bg;
  const cardBg = isDarkMode ? colors.card : '#FFFFFF';
  const borderColor = isDarkMode ? colors.border : '#E1EAF3';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: cardBg, borderColor }]} onPress={() => {}}>
          <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: current.color + '44' }]}>
              <MaterialIcons name={current.icon} size={52} color={current.color} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
            <Text style={[styles.body, { color: colors.secondaryText }]}>{current.body}</Text>
          </Animated.View>

          <View style={styles.dots}>
            {SLIDES.map((_s, i) => (
              <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={10}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === slide ? SLIDES[i].color : (isDarkMode ? colors.border : '#CBD5E1'),
                      width: i === slide ? 22 : 8,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: isLast ? current.color : colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>{isLast ? "C'est parti !" : 'Suivant'}</Text>
            {!isLast && <MaterialIcons name="arrow-forward" size={18} color="#fff" />}
          </Pressable>

          {isLast ? (
            <Pressable onPress={handleSetupAccount} hitSlop={12} style={styles.secondaryWrap}>
              <Text style={[styles.secondaryText, { color: colors.primary }]}>Créer un compte →</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onDismiss} hitSlop={12} style={styles.secondaryWrap}>
              <Text style={[styles.secondaryText, { color: colors.secondaryText }]}>Passer</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    borderRadius: uiRadii.card,
    borderWidth: 1.5,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    boxShadow: '0px 10px 24px rgba(0,0,0,0.22)',
    elevation: 12,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 28,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    width: '100%',
    paddingVertical: 15,
    borderRadius: uiRadii.pill,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryWrap: {
    marginTop: 16,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

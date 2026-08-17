import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_ACCENTS, getSoftShadow, uiRadii } from '../shared/uiPrimitives';
import { freshFontFamily } from '../shared/freshDirection';
import { useTheme, type TextSizeLevel } from '../settings/ThemeContext';
import type {
  GrammarLessonTextContent as GrammarLessonTextContentData,
  GrammarTextAccent,
  GrammarTextCard,
} from '../../types/lessonTypes';
import type { ThemeColors } from '../settings/ThemeContext';

const TEXT_SIZE_OPTIONS: { level: TextSizeLevel; label: string; sampleSize: number }[] = [
  { level: 'normal', label: 'Normal text size', sampleSize: 12 },
  { level: 'large', label: 'Large text size', sampleSize: 14 },
  { level: 'xlarge', label: 'Extra large text size', sampleSize: 16 },
];

interface GrammarLessonTextContentProps {
  content: GrammarLessonTextContentData;
  colors: ThemeColors;
  isDarkMode: boolean;
  // Matches the image version's container height so switching between Image/Text
  // tabs doesn't jump the page layout — content beyond it simply scrolls.
  height?: number;
}

// Renders `**bold**` segments as bold Text runs — the only inline markup the
// transcribed lesson content uses, matching what the teacher's original
// poster images actually emphasize (conjugated verb forms).
const renderInlineMarkup = (value: string, boldColor?: string) => {
  const parts = value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const text = isBold ? part.slice(2, -2) : part;
    return (
      <Text key={index} style={isBold ? [styles.boldRun, boldColor ? { color: boldColor } : null] : undefined}>
        {text}
      </Text>
    );
  });
};

const GrammarLessonTextContent: React.FC<GrammarLessonTextContentProps> = ({ content, colors, isDarkMode, height }) => {
  const accentFor = (accent: GrammarTextAccent) => DESIGN_ACCENTS[accent];
  const { textScale, textSizeLevel, updateTextSizeLevel } = useTheme();

  return (
    <ScrollView
      style={[styles.wrap, height ? { height } : null]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {content.cards.map((card, cardIndex) => (
        <GrammarTextCardView
          key={cardIndex}
          card={card}
          cardIndex={cardIndex}
          colors={colors}
          isDarkMode={isDarkMode}
          accentFor={accentFor}
          textScale={textScale}
          isFirstCard={cardIndex === 0}
          textSizeLevel={textSizeLevel}
          updateTextSizeLevel={updateTextSizeLevel}
        />
      ))}
    </ScrollView>
  );
};

const GrammarTextCardView: React.FC<{
  card: GrammarTextCard;
  cardIndex: number;
  colors: ThemeColors;
  isDarkMode: boolean;
  accentFor: (accent: GrammarTextAccent) => (typeof DESIGN_ACCENTS)[GrammarTextAccent];
  textScale: number;
  isFirstCard: boolean;
  textSizeLevel: TextSizeLevel;
  updateTextSizeLevel: (level: TextSizeLevel) => void;
}> = ({ card, cardIndex, colors, isDarkMode, accentFor, textScale, isFirstCard, textSizeLevel, updateTextSizeLevel }) => {
  const sc = (size: number) => Math.round(size * textScale);
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(cardIndex, 6) * 80).duration(320)}
      style={[
        styles.card,
        getSoftShadow(isDarkMode, 'soft'),
        { backgroundColor: colors.card, borderColor: colors.border },
        isFirstCard && styles.cardWithTextSizeControl,
      ]}
    >
      {isFirstCard && (
        // Docked to the corner of the card it actually resizes, instead of
        // floating over the whole scroll area like a disconnected 4th control.
        <View
          style={[
            styles.textSizeControl,
            { backgroundColor: isDarkMode ? colors.surfaceAlt : '#ECE8DD', borderColor: colors.border },
          ]}
        >
          {TEXT_SIZE_OPTIONS.map(({ level, label, sampleSize }) => (
            <TouchableOpacity
              key={level}
              onPress={() => updateTextSizeLevel(level)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: textSizeLevel === level }}
              style={[
                styles.textSizeButton,
                textSizeLevel === level && { backgroundColor: colors.buttonBackground },
              ]}
            >
              <Text
                style={[
                  styles.textSizeButtonText,
                  { fontSize: sampleSize, color: textSizeLevel === level ? colors.buttonText : colors.primary },
                ]}
              >
                Aa
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {card.eyebrow && (
        <Text style={[styles.eyebrow, { color: DESIGN_ACCENTS.blue.solid, fontSize: sc(11) }]}>{card.eyebrow}</Text>
      )}
      {card.paragraph && (
        <Text style={[styles.paragraph, { color: colors.text, fontSize: sc(15), lineHeight: sc(21) }]}>{card.paragraph}</Text>
      )}
      {card.tip && (
        <View style={[styles.tip, { backgroundColor: isDarkMode ? DESIGN_ACCENTS.blue.softDark : DESIGN_ACCENTS.blue.soft }]}>
          <Text style={[styles.tipText, { color: isDarkMode ? '#CBD8F5' : '#2E3F80', fontSize: sc(13.5), lineHeight: sc(19) }]}>
            {renderInlineMarkup(card.tip)}
          </Text>
        </View>
      )}

      {card.columns && (
        <View style={styles.columnsRow}>
          {card.columns.map((column, columnIndex) => {
            const accent = accentFor(column.accent);
            return (
              <View key={columnIndex} style={styles.column}>
                <Text style={[styles.columnLabel, { color: colors.secondaryText, fontSize: sc(11), lineHeight: sc(15) }]}>{column.label}</Text>
                <View
                  style={[
                    styles.columnBox,
                    { backgroundColor: isDarkMode ? accent.softDark : accent.soft },
                  ]}
                >
                  {column.rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.columnRow}>
                      {(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => (
                        <Text
                          key={cellIndex}
                          style={[styles.columnRowText, { color: isDarkMode ? '#F2F1EC' : accent.shadow, fontSize: sc(13.5) }]}
                        >
                          {renderInlineMarkup(cell)}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {card.examples && (
        <View style={styles.examples}>
          {card.examples.map((example, exampleIndex) => (
            <View
              key={exampleIndex}
              style={[
                styles.exampleRow,
                exampleIndex < card.examples!.length - 1 && [
                  styles.exampleRowDivider,
                  { borderBottomColor: colors.border },
                ],
              ]}
            >
              <MaterialIcons name="check" size={15} color={DESIGN_ACCENTS.blue.solid} />
              <Text style={[styles.exampleText, { color: colors.text, fontSize: sc(13.5), lineHeight: sc(19) }]}>
                {renderInlineMarkup(example.en)}
                <Text style={[styles.exampleTranslation, { color: colors.secondaryText }]}> — {example.fr}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {card.subsections && (
        <View style={styles.subsections}>
          {card.subsections.map((subsection, subsectionIndex) => {
            const accent = accentFor(subsection.accent);
            return (
              <View key={subsectionIndex} style={styles.subsection}>
                <Text style={[styles.subsectionText, { color: colors.text, fontSize: sc(13.5), lineHeight: sc(19) }]}>
                  {renderInlineMarkup(subsection.text)}
                </Text>
                <View
                  style={[
                    styles.subsectionBox,
                    { backgroundColor: isDarkMode ? accent.softDark : accent.soft },
                  ]}
                >
                  {subsection.rows.map((row, rowIndex) => (
                    <Text
                      key={rowIndex}
                      style={[styles.subsectionRowText, { color: isDarkMode ? '#F2F1EC' : accent.shadow, fontSize: sc(13.5) }]}
                    >
                      {renderInlineMarkup(row)}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
};

export default React.memo(GrammarLessonTextContent);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  scrollContent: {
    gap: 18,
  },
  card: {
    borderRadius: uiRadii.panel,
    borderWidth: 1,
    padding: 20,
  },
  // Reserves room in the first card's corner so the docked control doesn't
  // sit on top of its eyebrow/paragraph text.
  cardWithTextSizeControl: {
    paddingTop: 44,
  },
  textSizeControl: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
    zIndex: 5,
  },
  textSizeButton: {
    minHeight: 28,
    minWidth: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  textSizeButtonText: {
    fontWeight: freshFontFamily.bold,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: freshFontFamily.medium,
    marginBottom: 14,
  },
  tip: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  tipText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: freshFontFamily.semibold,
  },
  boldRun: {
    fontWeight: freshFontFamily.extrabold,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 15,
  },
  columnBox: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
  },
  columnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  columnRowText: {
    fontSize: 13.5,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
  examples: {
    marginTop: 16,
    gap: 2,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 9,
  },
  exampleRowDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  exampleText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: freshFontFamily.semibold,
  },
  exampleTranslation: {
    fontWeight: freshFontFamily.medium,
  },
  subsections: {
    gap: 16,
  },
  subsection: {
    gap: 8,
  },
  subsectionText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: freshFontFamily.medium,
  },
  subsectionBox: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 5,
  },
  subsectionRowText: {
    fontSize: 13.5,
    fontWeight: freshFontFamily.bold,
    textAlign: 'center',
  },
});

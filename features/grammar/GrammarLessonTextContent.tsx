import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
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
  height?: number;
  // Desktop/tablet viewport scale, e.g. GrammarQuiz's webLessonScale. Defaults to 1 (no scaling).
  scale?: number;
}




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

const GrammarLessonTextContent: React.FC<GrammarLessonTextContentProps> = ({ content, colors, isDarkMode, height, scale = 1 }) => {
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
          desktopScale={scale}
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
  desktopScale: number;
}> = ({ card, cardIndex, colors, isDarkMode, accentFor, textScale, isFirstCard, textSizeLevel, updateTextSizeLevel, desktopScale }) => {
  const sc = (size: number) => Math.round(size * textScale);
  // `sp` (spacing) scales this card's container padding/radius the same way
  // desktop/tablet viewport scaling already scales everything else in this
  // screen (GrammarQuiz passes its webLessonScale in as `desktopScale`).
  const sp = (size: number) => Math.round(size * desktopScale);
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(cardIndex, 6) * 80).duration(320)}
      style={[
        styles.card,
        getSoftShadow(isDarkMode, 'soft', colors.shadow, colors.visualStyle === 'pixel'),
        { backgroundColor: colors.card, borderColor: colors.border },
        isFirstCard && styles.cardWithTextSizeControl,
        desktopScale > 1 && { padding: sp(20), borderRadius: Math.round(uiRadii.panel * desktopScale) },
      ]}
    >
      {isFirstCard && (


        <View
          style={[
            styles.textSizeControl,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
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
        <Text style={[styles.eyebrow, { color: colors.text, fontSize: sc(15), lineHeight: sc(20) }]}>{card.eyebrow}</Text>
      )}
      {card.paragraph && (
        <Text style={[styles.paragraph, { color: colors.text, fontSize: sc(15), lineHeight: sc(21) }]}>{card.paragraph}</Text>
      )}
      {card.tip && (
        <View style={[styles.tip, desktopScale > 1 && { borderRadius: sp(12), padding: sp(14), marginBottom: sp(16) }, { backgroundColor: isDarkMode ? DESIGN_ACCENTS.blue.softDark : DESIGN_ACCENTS.blue.soft }]}>
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
              <React.Fragment key={columnIndex}>
                {columnIndex > 0 && (
                  <Text style={[styles.columnPlus, { color: colors.secondaryText, fontSize: sc(18) }]}>+</Text>
                )}
                <View style={styles.column}>
                  <View style={[styles.columnPill, { backgroundColor: accent.solid }]}>
                    <Text
                      style={[styles.columnPillText, { fontSize: sc(11) }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {column.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.columnBox,
                      desktopScale > 1 && { borderRadius: sp(14), paddingVertical: sp(14), paddingHorizontal: sp(8), gap: sp(6) },
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
              </React.Fragment>
            );
          })}
        </View>
      )}

      {card.examples && (
        <View style={styles.examples}>
          {card.examples.map((example, exampleIndex) => {
            const isCorrect = example.correct !== false;
            const accent = isCorrect ? DESIGN_ACCENTS.green : DESIGN_ACCENTS.coral;
            return (
              <View
                key={exampleIndex}
                style={[
                  styles.exampleCard,
                  desktopScale > 1 && { borderRadius: sp(14), padding: sp(12), gap: sp(4) },
                  { backgroundColor: isDarkMode ? DESIGN_ACCENTS.mauve.softDark : DESIGN_ACCENTS.mauve.soft },
                ]}
              >
                <View style={styles.exampleHeaderRow}>
                  <Text style={styles.exampleEmoji}>{isCorrect ? '🙂' : '😕'}</Text>
                  <MaterialIcons
                    name={isCorrect ? 'check' : 'close'}
                    size={16}
                    color={accent.solid}
                  />
                </View>
                <Text
                  style={[
                    styles.exampleText,
                    { color: isCorrect ? colors.text : accent.shadow, fontSize: sc(13.5), lineHeight: sc(19) },
                  ]}
                >
                  {renderInlineMarkup(example.en)}
                </Text>
                <Text style={[styles.exampleTranslation, { color: colors.secondaryText, fontSize: sc(12.5), lineHeight: sc(17) }]}>
                  {example.fr}
                </Text>
              </View>
            );
          })}
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
                    desktopScale > 1 && { borderRadius: sp(14), paddingVertical: sp(12), paddingHorizontal: sp(8), gap: sp(5) },
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
    fontSize: 15,
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 18,
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
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnPlus: {
    fontWeight: freshFontFamily.bold,
    alignSelf: 'center',
    marginTop: 14,
  },
  columnPill: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 6,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnPillText: {
    color: '#FFFFFF',
    fontWeight: freshFontFamily.extrabold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exampleCard: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  exampleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  exampleEmoji: {
    fontSize: 16,
  },
  exampleText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: freshFontFamily.semibold,
  },
  exampleTranslation: {
    fontStyle: 'italic',
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

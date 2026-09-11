import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text, { ThemedTextInput as TextInput } from '../../shared/ThemedText';
import { grammarLessons } from '../../../content/lessons/grammarRegistry';
import { vocabularyLessons as bundledVocabularyLessons } from '../../../content/lessons/vocabularyRegistry';
import { resolveChapterAppLink } from '../../../content/lessons/appLessonRegistry';
import { useTheme } from '../../settings/ThemeContext';
import type { CustomVocabularyLesson } from '../customLessonStorage';
import type { CustomChaptersAdmin } from './useCustomChaptersAdmin';
import { adminSharedStyles } from './adminSharedStyles';

type Props = CustomChaptersAdmin & {
  vocabularyLessons: CustomVocabularyLesson[];
};

export default function CustomChaptersAdminTab({
  chapters,
  draft,
  isSaving,
  categoryOptions,
  updateDraft,
  chooseCategory,
  chooseAppLesson,
  handleSave,
  handleEdit,
  handleDelete,
  handleReset,
  vocabularyLessons,
}: Props) {
  const { colors, isDarkMode } = useTheme();
  const inputColors = {
    color: colors.text,
    borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
    backgroundColor: isDarkMode ? colors.surface : '#fff',
  };
  const lessonPool = draft.appLinkTarget === 'grammar'
    ? grammarLessons
    : [...vocabularyLessons, ...bundledVocabularyLessons];
  const lessonQuery = draft.appLinkLessonTitle.trim().toLowerCase();
  const suggestions = lessonPool
    .filter((lesson: any) => typeof lesson?.title === 'string' && (!lessonQuery || lesson.title.toLowerCase().includes(lessonQuery)))
    .slice(0, 8);
  const resolvedLesson = draft.linkMode === 'app' && draft.appLinkLessonTitle.trim()
    ? resolveChapterAppLink({
        label: draft.title || 'Open lesson',
        target: draft.appLinkTarget,
        lessonTitle: draft.appLinkLessonTitle,
        ...(draft.appLinkLessonId ? { lessonId: draft.appLinkLessonId } : {}),
      }, { vocabularyLessons })
    : null;

  return (
    <>
      <View style={[adminSharedStyles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>Add a Chapter</Text>
        <Text style={[styles.helpText, { color: colors.secondaryText }]}>
          Add it to an existing level or type a new category. Position is optional; blank puts it last.
        </Text>

        <View style={styles.categoryRow}>
          {categoryOptions.map((category) => {
            const selected = draft.categoryTitle === category.title;
            return (
              <TouchableOpacity
                key={category.title}
                onPress={() => chooseCategory(category.title)}
                style={[
                  styles.categoryChip,
                  { borderColor: selected ? category.color : colors.border },
                  selected && { backgroundColor: category.color },
                ]}
              >
                <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '800' }}>
                  {category.icon} {category.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.grid}>
          <View style={styles.flexField}>
            <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Category</Text>
            <TextInput value={draft.categoryTitle} onChangeText={(value) => updateDraft('categoryTitle', value)} style={[adminSharedStyles.input, inputColors]} placeholder="e.g. 5e or Summer course" placeholderTextColor="#94A3B8" />
          </View>
          <View style={styles.smallField}>
            <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Icon</Text>
            <TextInput value={draft.categoryIcon} onChangeText={(value) => updateDraft('categoryIcon', value)} style={[adminSharedStyles.input, inputColors]} placeholder="📚" placeholderTextColor="#94A3B8" />
          </View>
          <View style={styles.mediumField}>
            <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Color</Text>
            <TextInput value={draft.categoryColor} onChangeText={(value) => updateDraft('categoryColor', value)} style={[adminSharedStyles.input, inputColors]} placeholder="#1671B6" placeholderTextColor="#94A3B8" autoCapitalize="none" />
          </View>
        </View>

        <View style={adminSharedStyles.field}>
          <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Chapter title</Text>
          <TextInput value={draft.title} onChangeText={(value) => updateDraft('title', value)} style={[adminSharedStyles.input, inputColors]} placeholder="Chapter 4 — Around London" placeholderTextColor="#94A3B8" />
        </View>

        <View style={styles.modeRow}>
          {(['url', 'app'] as const).map((mode) => {
            const selected = draft.linkMode === mode;
            return (
              <TouchableOpacity key={mode} onPress={() => updateDraft('linkMode', mode)} style={[styles.modeButton, { borderColor: selected ? colors.primary : colors.border }, selected && { backgroundColor: colors.buttonBackground }]}>
                <Text style={{ color: selected ? colors.buttonText : colors.text, fontWeight: '800' }}>
                  {mode === 'url' ? 'External link' : 'In-app lesson'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {draft.linkMode === 'url' ? (
          <View style={adminSharedStyles.field}>
            <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>URL</Text>
            <TextInput value={draft.url} onChangeText={(value) => updateDraft('url', value)} style={[adminSharedStyles.input, inputColors]} placeholder="https://..." placeholderTextColor="#94A3B8" autoCapitalize="none" autoCorrect={false} />
          </View>
        ) : (
          <View style={adminSharedStyles.field}>
            <View style={styles.modeRow}>
              {(['grammar', 'vocabulary'] as const).map((target) => {
                const selected = draft.appLinkTarget === target;
                return (
                  <TouchableOpacity key={target} onPress={() => updateDraft('appLinkTarget', target)} style={[styles.modeButton, { borderColor: selected ? colors.primary : colors.border }, selected && { backgroundColor: colors.buttonBackground }]}>
                    <Text style={{ color: selected ? colors.buttonText : colors.text, fontWeight: '800' }}>{target === 'grammar' ? 'Grammar' : 'Vocabulary'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Lesson</Text>
            <TextInput value={draft.appLinkLessonTitle} onChangeText={(value) => updateDraft('appLinkLessonTitle', value)} style={[adminSharedStyles.input, inputColors]} placeholder="Search by lesson title" placeholderTextColor="#94A3B8" />
            <Text style={[styles.matchText, { color: resolvedLesson ? '#15803D' : colors.secondaryText }]}>
              {resolvedLesson ? `Linked to: ${resolvedLesson.lesson.title}` : 'Choose an exact match below.'}
            </Text>
            <View style={styles.suggestionRow}>
              {suggestions.map((lesson: any) => (
                <TouchableOpacity key={`${lesson.id ?? ''}-${lesson.title}`} onPress={() => chooseAppLesson(lesson.title, lesson.id)} style={[styles.suggestionChip, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }} numberOfLines={1}>{lesson.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.positionField}>
          <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Position in category</Text>
          <TextInput value={draft.position} onChangeText={(value) => updateDraft('position', value.replace(/[^0-9]/g, ''))} style={[adminSharedStyles.input, inputColors]} placeholder="Last" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleReset} style={adminSharedStyles.secondaryButton}><Text style={adminSharedStyles.secondaryButtonText}>Reset</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[adminSharedStyles.primaryButton, isSaving && adminSharedStyles.disabledButton]}><Text style={adminSharedStyles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Chapter'}</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.library}>
        <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>Saved Custom Chapters</Text>
        {chapters.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}><Text style={{ color: colors.secondaryText }}>No custom chapters yet.</Text></View>
        ) : chapters.map((chapter) => (
          <View key={chapter.id} style={[styles.chapterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.chapterCopy}>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>{chapter.categoryIcon} {chapter.title}</Text>
              <Text style={{ color: colors.secondaryText, fontWeight: '700' }}>
                {chapter.categoryTitle} · {chapter.appLink ? `${chapter.appLink.target}: ${chapter.appLink.lessonTitle}` : chapter.url}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(chapter)} style={adminSharedStyles.secondaryButton}><Text style={adminSharedStyles.secondaryButtonText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(chapter)} style={adminSharedStyles.deleteLessonButton}><Text style={adminSharedStyles.deleteLessonButtonText}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  helpText: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: -6, marginBottom: 14 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { minHeight: 34, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', paddingHorizontal: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  flexField: { flex: 1, minWidth: 220 },
  smallField: { width: 90 },
  mediumField: { width: 130 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  modeButton: { minHeight: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  matchText: { fontSize: 12, fontWeight: '700', marginTop: 7 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  suggestionChip: { maxWidth: 250, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  positionField: { width: 180, marginBottom: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'flex-end' },
  library: { paddingHorizontal: 16 },
  emptyCard: { borderRadius: 14, padding: 18 },
  chapterCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 10 },
  chapterCopy: { gap: 3 },
  chapterTitle: { fontSize: 16, fontWeight: '900' },
});

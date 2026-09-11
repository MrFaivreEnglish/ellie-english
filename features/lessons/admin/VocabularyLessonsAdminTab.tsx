import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text, { ThemedTextInput as TextInput } from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { useTheme } from '../../settings/ThemeContext';
import { adminSharedStyles } from './adminSharedStyles';
import type { useVocabularyLessonsAdmin } from './useVocabularyLessonsAdmin';

type VocabularyLessonsAdminTabProps = ReturnType<typeof useVocabularyLessonsAdmin> & {
  isWideLayout: boolean;
};

export default function VocabularyLessonsAdminTab({
  lessons,
  draft,
  isSaving,
  isPickingNewCategory,
  setIsPickingNewCategory,
  validWordCount,
  vocabularyCategoryTitles,
  lessonValidationItems,
  previewWordPairs,
  isEditingExistingLesson,
  canSaveLesson,
  handleResetDraftPress,
  updateDraftField,
  updateWord,
  addWordRow,
  removeWordRow,
  handleImportPairs,
  handleSave,
  handleCopyCurrentLessonJson,
  handleCopyAllLessonsJson,
  handleEdit,
  handleDelete,
  isWideLayout,
}: VocabularyLessonsAdminTabProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <>
      <View
        style={[
          adminSharedStyles.editorCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
          },
        ]}
      >
        <View style={adminSharedStyles.sectionHeaderRow}>
          <View>
            <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>
              {isEditingExistingLesson ? 'Edit Lesson' : 'New Lesson'}
            </Text>
            <Text style={[adminSharedStyles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
              Save locally first, test in the app, then export for the build.
            </Text>
          </View>
          <View style={styles.exportRowCompact}>
            <TouchableOpacity onPress={handleCopyCurrentLessonJson} style={adminSharedStyles.exportButton}>
              <MaterialIcons name="content-copy" size={18} color="#1671B6" />
              <Text style={adminSharedStyles.exportButtonText}>Copy Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopyAllLessonsJson} style={adminSharedStyles.exportButton}>
              <MaterialIcons name="inventory-2" size={18} color="#1671B6" />
              <Text style={adminSharedStyles.exportButtonText}>Copy Lessons</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.lessonEditorGrid, isWideLayout && styles.lessonEditorGridWide]}>
          <View style={[styles.lessonDetailsColumn, isWideLayout && styles.lessonDetailsColumnWide]}>
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                  borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
                },
              ]}
            >
              <View style={styles.previewHeaderRow}>
                <View style={styles.previewIcon}>
                  <MaterialIcons name="style" size={20} color="#1671B6" />
                </View>
                <View style={styles.previewTitleBlock}>
                  <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                    {draft.title.trim() || 'Untitled lesson'}
                  </Text>
                  <Text style={[styles.previewMeta, { color: colors.secondaryText }]}>
                    {(draft.category.trim() || 'Custom')} - {validWordCount} words
                  </Text>
                </View>
              </View>

              {previewWordPairs.length > 0 ? (
                <View style={styles.previewWords}>
                  {previewWordPairs.map((word, index) => (
                    <View key={`${word.english}-${word.french}-${index}`} style={styles.previewWordRow}>
                      <Text style={[styles.previewWordText, { color: colors.text }]} numberOfLines={1}>
                        {word.english.trim()}
                      </Text>
                      <MaterialIcons name="arrow-forward" size={14} color={colors.secondaryText} />
                      <Text style={[styles.previewWordText, { color: colors.text }]} numberOfLines={1}>
                        {word.french.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.previewEmptyText, { color: colors.secondaryText }]}>
                  Add word pairs to preview the lesson.
                </Text>
              )}
            </View>

            <View style={adminSharedStyles.field}>
              <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Title</Text>
              <TextInput
                value={draft.title}
                onChangeText={(value) => updateDraftField('title', value)}
                placeholder="Food Basics - 5e A"
                placeholderTextColor="#94A3B8"
                style={[
                  adminSharedStyles.input,
                  {
                    color: colors.text,
                    borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                    backgroundColor: isDarkMode ? colors.surface : '#fff',
                  },
                ]}
              />
            </View>

            <View style={adminSharedStyles.field}>
              <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Description</Text>
              <TextInput
                value={draft.description}
                onChangeText={(value) => updateDraftField('description', value)}
                placeholder="Optional description"
                placeholderTextColor="#94A3B8"
                style={[
                  adminSharedStyles.input,
                  {
                    color: colors.text,
                    borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                    backgroundColor: isDarkMode ? colors.surface : '#fff',
                  },
                ]}
              />
            </View>

            <View style={adminSharedStyles.field}>
              <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Category</Text>
              <Text style={[styles.fieldHint, { color: colors.secondaryText }]}>
                Pick an existing section so the lesson shows up there instead of always landing in "Custom".
              </Text>
              <View style={styles.categoryChipRow}>
                {vocabularyCategoryTitles.map((title) => {
                  const isSelected = !isPickingNewCategory && draft.category.trim() === title;
                  return (
                    <TouchableOpacity
                      key={title}
                      onPress={() => {
                        setIsPickingNewCategory(false);
                        updateDraftField('category', title);
                      }}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? colors.buttonBackground : (isDarkMode ? colors.surface : '#F6F7F9'),
                          borderColor: isSelected ? colors.buttonBackground : (isDarkMode ? colors.border : '#DDE5EE'),
                        },
                      ]}
                    >
                      <Text style={[styles.categoryChipText, { color: isSelected ? colors.buttonText : colors.text }]}>
                        {title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => setIsPickingNewCategory(true)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isPickingNewCategory ? colors.buttonBackground : (isDarkMode ? colors.surface : '#F6F7F9'),
                      borderColor: isPickingNewCategory ? colors.buttonBackground : (isDarkMode ? colors.border : '#DDE5EE'),
                    },
                  ]}
                >
                  <MaterialIcons name="add" size={14} color={isPickingNewCategory ? colors.buttonText : colors.text} />
                  <Text style={[styles.categoryChipText, { color: isPickingNewCategory ? colors.buttonText : colors.text }]}>
                    New section
                  </Text>
                </TouchableOpacity>
              </View>
              {isPickingNewCategory && (
                <TextInput
                  value={draft.category}
                  onChangeText={(value) => updateDraftField('category', value)}
                  placeholder="New section name"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                  style={[
                    adminSharedStyles.input,
                    styles.categoryNewInput,
                    {
                      color: colors.text,
                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                      backgroundColor: isDarkMode ? colors.surface : '#fff',
                    },
                  ]}
                />
              )}
            </View>

            <View style={adminSharedStyles.field}>
              <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Image URL</Text>
              <TextInput
                  value={draft.imageUrl}
                  onChangeText={(value) => updateDraftField('imageUrl', value)}
                  placeholder="Used inside the lesson"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    adminSharedStyles.input,
                    {
                      color: colors.text,
                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                      backgroundColor: isDarkMode ? colors.surface : '#fff',
                    },
                  ]}
                />
            </View>

            <View style={styles.validationPanel}>
              {lessonValidationItems.map((item) => {
                const toneColor = item.tone === 'success'
                  ? '#15803D'
                  : item.tone === 'warning'
                    ? '#B45309'
                    : item.tone === 'error'
                      ? '#C62828'
                      : '#4B5563';
                const toneBackground = item.tone === 'success'
                  ? '#ECFDF3'
                  : item.tone === 'warning'
                    ? '#FEF3C7'
                    : item.tone === 'error'
                      ? '#FFF1F1'
                      : '#EEF2F6';

                return (
                  <View key={item.text} style={[styles.validationRow, { backgroundColor: toneBackground }]}>
                    <MaterialIcons name={item.icon} size={17} color={toneColor} />
                    <Text style={[styles.validationText, { color: toneColor }]}>{item.text}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleResetDraftPress} style={adminSharedStyles.secondaryButton}>
                <Text style={adminSharedStyles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[adminSharedStyles.primaryButton, (!canSaveLesson || isSaving) && adminSharedStyles.disabledButton]}
                disabled={!canSaveLesson || isSaving}
              >
                <Text style={adminSharedStyles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Locally'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.wordsColumn, isWideLayout && styles.wordsColumnWide]}>
            <View style={styles.wordsHeader}>
              <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>Word Pairs</Text>
              <Text style={[styles.wordsCounter, { color: colors.secondaryText }]}>
                {validWordCount} valid
              </Text>
            </View>

            <View style={styles.wordsList}>
              {draft.flashcards.map((word, index) => (
                <View key={`${draft.id}-${index}`} style={styles.wordRow}>
                  <TextInput
                    value={word.english}
                    onChangeText={(value) => updateWord(index, 'english', value)}
                    placeholder="English"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.wordInput,
                      {
                        color: colors.text,
                        borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                        backgroundColor: isDarkMode ? colors.surface : '#fff',
                      },
                    ]}
                  />
                  <TextInput
                    value={word.french}
                    onChangeText={(value) => updateWord(index, 'french', value)}
                    placeholder="French"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.wordInput,
                      {
                        color: colors.text,
                        borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                        backgroundColor: isDarkMode ? colors.surface : '#fff',
                      },
                    ]}
                  />
                  <TouchableOpacity onPress={() => removeWordRow(index)} style={styles.removeWordButton}>
                    <MaterialIcons name="delete-outline" size={20} color="#C62828" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.wordActionRow}>
              <TouchableOpacity onPress={addWordRow} style={styles.addRowButton}>
                <MaterialIcons name="add-circle-outline" size={20} color="#1671B6" />
                <Text style={styles.addRowButtonText}>Add Pair</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleImportPairs} style={styles.importButton}>
                <MaterialIcons name="upload-file" size={20} color="#1671B6" />
                <Text style={styles.importButtonText}>Import File</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.importHelpText, { color: colors.secondaryText }]}>
              CSV, TSV, TXT, or JSON with two columns: English, French.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.librarySection}>
        <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>Saved Custom Lessons</Text>
        {lessons.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No custom lessons yet.</Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <View
              key={lesson.id}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDarkMode ? colors.border : '#DDE5EE',
                },
              ]}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.lessonTextBlock}>
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <Text style={[styles.lessonMeta, { color: colors.secondaryText }]}>
                    {lesson.category || 'Custom'} - {lesson.flashcards.length} words
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(lesson)}>
                  <MaterialIcons name="delete-outline" size={22} color="#C62828" />
                </TouchableOpacity>
              </View>

              {!!lesson.description && (
                <Text style={[styles.lessonDescription, { color: colors.secondaryText }]}>
                  {lesson.description}
                </Text>
              )}

              <View style={styles.lessonActionsRow}>
                <TouchableOpacity onPress={() => handleEdit(lesson)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit Lesson</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(lesson)} style={adminSharedStyles.deleteLessonButton}>
                  <Text style={adminSharedStyles.deleteLessonButtonText}>Delete Lesson</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  exportRowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  lessonEditorGrid: {
    gap: 18,
  },
  lessonEditorGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lessonDetailsColumn: {
    gap: 0,
  },
  lessonDetailsColumnWide: {
    flex: 0.95,
    minWidth: 0,
  },
  wordsColumn: {
    gap: 0,
  },
  wordsColumnWide: {
    flex: 1.15,
    minWidth: 0,
  },
  previewCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  previewMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  previewWords: {
    marginTop: 12,
    gap: 8,
  },
  previewWordRow: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(22,113,182,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  previewWordText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
  },
  previewEmptyText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  validationPanel: {
    gap: 8,
    marginTop: -2,
  },
  validationRow: {
    minHeight: 34,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  validationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 10,
  },
  categoryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryNewInput: {
    marginTop: 10,
  },
  wordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordsCounter: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  wordsList: {
    gap: 10,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  removeWordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F1',
  },
  wordActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addRowButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1671B6',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1671B6',
  },
  importHelpText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  librarySection: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 18,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  lessonCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  lessonTextBlock: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  lessonMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
  lessonDescription: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1671B6',
  },
  lessonActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

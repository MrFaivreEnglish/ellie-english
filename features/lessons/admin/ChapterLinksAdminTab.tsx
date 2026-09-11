import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text, { ThemedTextInput as TextInput } from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { useTheme } from '../../settings/ThemeContext';
import { vocabularyLessons as bundledVocabularyLessons } from '../../../content/lessons/vocabularyRegistry';
import { grammarLessons } from '../../../content/lessons/grammarRegistry';
import { resolveChapterAppLink } from '../../../content/lessons/appLessonRegistry';
import { adminSharedStyles } from './adminSharedStyles';
import type { useChapterLinksAdmin } from './useChapterLinksAdmin';

type ChapterLinksAdminTabProps = ReturnType<typeof useChapterLinksAdmin>;

export default function ChapterLinksAdminTab({
  editingChapterLinkIds,
  expandedChapterLevels,
  chapterLinkOverrides,
  chapterLinkDrafts,
  fetchingTitleIds,
  chapterLinkGroups,
  chapterLinkOverrideMap,
  getPublishedChapterUrl,
  getPublishedChapterTitle,
  toggleChapterLinkEditor,
  updateChapterLinkDraft,
  handleSaveChapterLink,
  handleFetchChapterLinkTitle,
  handleResetChapterLink,
  toggleChapterLevel,
  handleCopyChapterLinksJson,
  vocabularyLessons,
}: ChapterLinksAdminTabProps) {
  const { colors, isDarkMode } = useTheme();

  return (
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
        <View style={adminSharedStyles.chapterLinksTitleBlock}>
          <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>Chapter Links</Text>
          <Text style={[adminSharedStyles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
            Edit only the chapters that need a custom Digipad title or URL.
          </Text>
        </View>
        <TouchableOpacity onPress={handleCopyChapterLinksJson} style={adminSharedStyles.exportButton}>
          <MaterialIcons name="inventory-2" size={18} color="#1671B6" />
          <Text style={adminSharedStyles.exportButtonText}>Copy Link JSON</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chapterLinkList}>
        {chapterLinkGroups.map((group) => {
          const isExpanded = expandedChapterLevels[group.title] ?? false;
          const localOverrideCount = group.items.filter((item) =>
            chapterLinkOverrides.some((override) => override.id === item.id)
          ).length;

          return (
            <View
              key={group.title}
              style={[
                styles.chapterLevelGroup,
                {
                  backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                  borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleChapterLevel(group.title)}
                style={styles.chapterLevelHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
              >
                <View style={styles.chapterLevelHeaderLeft}>
                  <View style={[styles.chapterLevelBadge, { backgroundColor: group.color }]}>
                    <Text style={styles.chapterLevelBadgeText}>{group.title}</Text>
                  </View>
                  <View>
                    <Text style={[styles.chapterLevelTitle, { color: colors.text }]}>
                      {group.title} chapters
                    </Text>
                    <Text style={[styles.chapterLevelMeta, { color: colors.secondaryText }]}>
                      {group.items.length} links{localOverrideCount > 0 ? ` - ${localOverrideCount} custom` : ''}
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={colors.secondaryText}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.chapterLevelItems}>
                  {group.items.map((item) => {
                    const publishedTitle = getPublishedChapterTitle(item);
                    const publishedUrl = getPublishedChapterUrl(item);
                    const effectiveOverride = chapterLinkOverrideMap.get(item.id);
                    const effectiveAppLink = effectiveOverride?.appLink;
                    const currentDraft = chapterLinkDrafts[item.id] ?? {
                      displayTitle: publishedTitle,
                      url: publishedUrl,
                      appLinkMode: effectiveAppLink ? 'app' as const : 'url' as const,
                      appLinkTarget: effectiveAppLink?.target ?? 'grammar' as const,
                      appLinkLessonTitle: effectiveAppLink?.lessonTitle ?? '',
                      appLinkLessonId: effectiveAppLink?.lessonId ?? '',
                    };
                    const draftAppLinkMode = currentDraft.appLinkMode ?? (effectiveAppLink ? 'app' : 'url');
                    const draftAppLinkTarget = currentDraft.appLinkTarget ?? effectiveAppLink?.target ?? 'grammar';
                    const draftAppLinkLessonTitle = currentDraft.appLinkLessonTitle ?? effectiveAppLink?.lessonTitle ?? '';
                    const draftAppLinkLessonId = currentDraft.appLinkLessonId ?? effectiveAppLink?.lessonId ?? '';
                    const hasLocalOverride = chapterLinkOverrides.some((override) => override.id === item.id);
                    const effectiveTitle = effectiveOverride?.displayTitle ?? item.defaultTitle;
                    const effectiveUrl = effectiveOverride?.url ?? item.defaultUrl;
                    const hasUnsavedChange =
                      currentDraft.displayTitle.trim() !== effectiveTitle ||
                      (draftAppLinkMode === 'url'
                        ? currentDraft.url.trim() !== effectiveUrl || !!effectiveAppLink
                        : draftAppLinkTarget !== effectiveAppLink?.target
                          || draftAppLinkLessonTitle.trim() !== (effectiveAppLink?.lessonTitle ?? '')
                          || draftAppLinkLessonId.trim() !== (effectiveAppLink?.lessonId ?? '')
                          || !effectiveAppLink);
                    const resolvedAppLinkPreview = draftAppLinkMode === 'app' && draftAppLinkLessonTitle.trim()
                      ? resolveChapterAppLink({
                          label: currentDraft.displayTitle || item.defaultTitle,
                          target: draftAppLinkTarget,
                          lessonTitle: draftAppLinkLessonTitle.trim(),
                          ...(draftAppLinkLessonId ? { lessonId: draftAppLinkLessonId } : {}),
                        }, { vocabularyLessons })
                      : null;
                    const isEditingRow = editingChapterLinkIds[item.id] || hasUnsavedChange;
                    const statusLabel = hasUnsavedChange
                      ? 'Unsaved'
                      : hasLocalOverride
                        ? 'Custom'
                        : 'Published';
                    const statusColor = hasUnsavedChange
                      ? '#B45309'
                      : hasLocalOverride
                        ? '#1671B6'
                        : '#4B5563';
                    const statusBackground = hasUnsavedChange
                      ? '#FEF3C7'
                      : hasLocalOverride
                        ? '#E8F4FF'
                        : '#EEF2F6';

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.chapterLinkRow,
                          {
                            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                            borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
                          },
                        ]}
                      >
                        <View style={styles.chapterLinkSummaryRow}>
                          <View style={styles.chapterLinkSummaryLeft}>
                            <View style={[styles.chapterLevelBadge, { backgroundColor: item.color }]}>
                              <Text style={styles.chapterLevelBadgeText}>{item.categoryTitle}</Text>
                            </View>
                            <View style={styles.chapterLinkTitleBlock}>
                              <Text style={[styles.chapterLinkTitle, { color: colors.text }]} numberOfLines={1}>
                                {effectiveTitle}
                              </Text>
                              <Text style={[styles.chapterLinkStatus, { color: colors.secondaryText }]} numberOfLines={1}>
                                {draftAppLinkMode === 'app'
                                  ? `In-app · ${draftAppLinkTarget === 'grammar' ? 'Grammar' : 'Vocabulary'} · ${draftAppLinkLessonTitle.trim() || '(no lesson chosen)'}`
                                  : (currentDraft.url.trim() || effectiveUrl)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.chapterLinkSummaryActions}>
                            <View style={[styles.statusChip, { backgroundColor: statusBackground }]}>
                              <Text style={[styles.statusChipText, { color: statusColor }]}>{statusLabel}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => toggleChapterLinkEditor(item.id)}
                              style={styles.inlineEditButton}
                            >
                              <MaterialIcons
                                name={isEditingRow ? 'expand-less' : 'edit'}
                                size={18}
                                color="#1671B6"
                              />
                              <Text style={styles.inlineEditButtonText}>
                                {isEditingRow ? 'Close' : 'Edit'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {isEditingRow && (
                          <View style={styles.chapterLinkEditorPanel}>
                            <View style={adminSharedStyles.field}>
                              <View style={styles.fieldLabelRow}>
                                <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Display Title</Text>
                                <TouchableOpacity
                                  onPress={() => handleFetchChapterLinkTitle(item)}
                                  disabled={!!fetchingTitleIds[item.id]}
                                  style={[styles.fetchTitleButton, fetchingTitleIds[item.id] && adminSharedStyles.disabledSecondaryButton]}
                                >
                                  <MaterialIcons name="sync" size={14} color="#1671B6" />
                                  <Text style={styles.fetchTitleButtonText}>
                                    {fetchingTitleIds[item.id] ? 'Fetching...' : 'Fetch title from link'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <TextInput
                                value={currentDraft.displayTitle}
                                onChangeText={(value) => updateChapterLinkDraft(item.id, 'displayTitle', value)}
                                placeholder={item.defaultTitle}
                                placeholderTextColor="#94A3B8"
                                style={[
                                  adminSharedStyles.input,
                                  {
                                    color: colors.text,
                                    borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                                    backgroundColor: isDarkMode ? colors.card : '#fff',
                                  },
                                ]}
                              />
                            </View>

                            <View style={adminSharedStyles.field}>
                              <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Link Type</Text>
                              <View style={styles.chapterLinkModeRow}>
                                {(['url', 'app'] as const).map((mode) => (
                                  <TouchableOpacity
                                    key={mode}
                                    onPress={() => updateChapterLinkDraft(item.id, 'appLinkMode', mode)}
                                    style={[
                                      styles.chapterLinkModeButton,
                                      draftAppLinkMode === mode && styles.chapterLinkModeButtonActive,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.chapterLinkModeButtonText,
                                        draftAppLinkMode === mode && styles.chapterLinkModeButtonTextActive,
                                      ]}
                                    >
                                      {mode === 'url' ? 'External URL' : 'In-app lesson'}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            {draftAppLinkMode === 'url' ? (
                              <View style={adminSharedStyles.field}>
                                <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText }]}>Chapter Link</Text>
                                <TextInput
                                  value={currentDraft.url}
                                  onChangeText={(value) => updateChapterLinkDraft(item.id, 'url', value)}
                                  placeholder="https://digipad.app/..."
                                  placeholderTextColor="#94A3B8"
                                  autoCapitalize="none"
                                  autoCorrect={false}
                                  style={[
                                    adminSharedStyles.input,
                                    styles.chapterLinkInput,
                                    {
                                      color: colors.text,
                                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                                      backgroundColor: isDarkMode ? colors.card : '#fff',
                                    },
                                  ]}
                                />
                              </View>
                            ) : (
                              <View style={adminSharedStyles.field}>
                                <View style={styles.chapterLinkModeRow}>
                                  {(['grammar', 'vocabulary'] as const).map((target) => (
                                    <TouchableOpacity
                                      key={target}
                                      onPress={() => updateChapterLinkDraft(item.id, 'appLinkTarget', target)}
                                      style={[
                                        styles.chapterLinkModeButton,
                                        draftAppLinkTarget === target && styles.chapterLinkModeButtonActive,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.chapterLinkModeButtonText,
                                          draftAppLinkTarget === target && styles.chapterLinkModeButtonTextActive,
                                        ]}
                                      >
                                        {target === 'grammar' ? 'Grammar' : 'Vocabulary'}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={[adminSharedStyles.fieldLabel, { color: colors.secondaryText, marginTop: 10 }]}>
                                  Lesson title
                                </Text>
                                <TextInput
                                  value={draftAppLinkLessonTitle}
                                  onChangeText={(value) => updateChapterLinkDraft(item.id, 'appLinkLessonTitle', value)}
                                  placeholder={draftAppLinkTarget === 'grammar' ? 'e.g. Present simple' : 'e.g. Cinema'}
                                  placeholderTextColor="#94A3B8"
                                  style={[
                                    adminSharedStyles.input,
                                    {
                                      color: colors.text,
                                      borderColor: isDarkMode ? colors.borderStrong : '#DDE5EE',
                                      backgroundColor: isDarkMode ? colors.card : '#fff',
                                    },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.chapterLinkStatus,
                                    { color: resolvedAppLinkPreview ? '#1671B6' : (draftAppLinkLessonTitle.trim() ? '#B91C1C' : colors.secondaryText), marginTop: 6 },
                                  ]}
                                >
                                  {draftAppLinkLessonTitle.trim()
                                    ? (resolvedAppLinkPreview
                                        ? `Found: "${resolvedAppLinkPreview.lesson.title}"`
                                        : `No matching ${draftAppLinkTarget} lesson found.`)
                                    : 'Enter the exact lesson title as it appears in the app.'}
                                </Text>
                                {!resolvedAppLinkPreview && draftAppLinkLessonTitle.trim().length >= 2 && (() => {
                                  const query = draftAppLinkLessonTitle.trim().toLowerCase();
                                  const pool = draftAppLinkTarget === 'grammar'
                                    ? grammarLessons
                                    : [...vocabularyLessons, ...bundledVocabularyLessons];
                                  const suggestions = pool
                                    .filter((candidate: any) => typeof candidate?.title === 'string' && candidate.title.toLowerCase().includes(query))
                                    .slice(0, 5);

                                  if (suggestions.length === 0) return null;

                                  return (
                                    <View style={styles.chapterLinkSuggestions}>
                                      {suggestions.map((candidate: any) => (
                                        <TouchableOpacity
                                          key={candidate.title}
                                          onPress={() => {
                                            updateChapterLinkDraft(item.id, 'appLinkLessonTitle', candidate.title);
                                            updateChapterLinkDraft(item.id, 'appLinkLessonId', candidate.id === undefined ? '' : String(candidate.id));
                                          }}
                                          style={styles.chapterLinkSuggestionChip}
                                        >
                                          <Text style={styles.chapterLinkSuggestionChipText} numberOfLines={1}>
                                            {candidate.title}
                                          </Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  );
                                })()}
                              </View>
                            )}

                            <View style={styles.chapterLinkActionsRow}>
                              <TouchableOpacity
                                onPress={() => handleResetChapterLink(item)}
                                disabled={!hasUnsavedChange && !hasLocalOverride}
                                style={[
                                  adminSharedStyles.secondaryButton,
                                  !hasUnsavedChange && !hasLocalOverride && adminSharedStyles.disabledSecondaryButton,
                                ]}
                              >
                                <Text style={adminSharedStyles.secondaryButtonText}>Reset</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleSaveChapterLink(item)}
                                disabled={!hasUnsavedChange}
                                style={[
                                  adminSharedStyles.primaryButton,
                                  hasUnsavedChange && adminSharedStyles.primaryButtonAttention,
                                  !hasUnsavedChange && adminSharedStyles.disabledButton,
                                ]}
                              >
                                <Text style={adminSharedStyles.primaryButtonText}>Save Link</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chapterLinkList: {
    gap: 12,
  },
  chapterLevelGroup: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  chapterLevelHeader: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterLevelHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterLevelTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  chapterLevelMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chapterLevelItems: {
    gap: 10,
    padding: 10,
    paddingTop: 0,
  },
  chapterLinkRow: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  chapterLinkSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chapterLinkSummaryLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterLinkSummaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  chapterLevelBadge: {
    minWidth: 46,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chapterLevelBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  chapterLinkTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  chapterLinkTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  chapterLinkStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chapterLinkModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chapterLinkModeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE5EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chapterLinkModeButtonActive: {
    backgroundColor: '#1671B6',
    borderColor: '#1671B6',
  },
  chapterLinkModeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4B5563',
  },
  chapterLinkModeButtonTextActive: {
    color: '#FFFFFF',
  },
  chapterLinkSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chapterLinkSuggestionChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE5EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chapterLinkSuggestionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1671B6',
  },
  statusChip: {
    minHeight: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inlineEditButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
  },
  inlineEditButtonText: {
    color: '#1671B6',
    fontSize: 12,
    fontWeight: '900',
  },
  chapterLinkEditorPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.35)',
  },
  chapterLinkInput: {
    fontSize: 13,
  },
  chapterLinkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fetchTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  fetchTitleButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1671B6',
  },
});

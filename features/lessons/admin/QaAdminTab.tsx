import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Text from '../../shared/ThemedText';
import MaterialIcons from '../../shared/ThemedMaterialIcon';
import { useTheme } from '../../settings/ThemeContext';
import { adminSharedStyles } from './adminSharedStyles';
import type { useQaSnapshot } from './useQaSnapshot';

const packageInfo = require('../../../package.json') as { version?: string };

type QaAdminTabProps = ReturnType<typeof useQaSnapshot> & {
  openEditsCount: number;
};

export default function QaAdminTab({
  qaSnapshot,
  qaMessage,
  chapterLinkOverridesCount,
  lessonsCount,
  openEditsCount,
  loadQaSnapshot,
  handleClearLocalProgress,
}: QaAdminTabProps) {
  const { colors, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

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
          <Text style={[adminSharedStyles.sectionTitle, { color: colors.text }]}>QA Snapshot</Text>
          <Text style={[adminSharedStyles.chapterLinksSubtitle, { color: colors.secondaryText }]}>
            Quick diagnostics for builds, theme checks, and saved-progress testing.
          </Text>
        </View>
        <TouchableOpacity onPress={loadQaSnapshot} style={adminSharedStyles.exportButton}>
          <MaterialIcons name="refresh" size={18} color="#1671B6" />
          <Text style={adminSharedStyles.exportButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qaGrid}>
        {[
          ['Version', packageInfo.version ?? 'unknown'],
          ['Platform', Platform.OS],
          ['Theme', isDarkMode ? 'Dark' : 'Light'],
          ['Width', `${Math.round(width)} px`],
          ['XP', String(qaSnapshot.xp)],
          ['Learnt words', `${qaSnapshot.learnedWords} / ${qaSnapshot.learnedLessons} lessons`],
          ['Grammar answers', `${qaSnapshot.grammarAnswers} / ${qaSnapshot.grammarLessons} lessons`],
          ['Timer records', String(qaSnapshot.timerBestCount)],
          ['Custom links', String(chapterLinkOverridesCount)],
          ['Custom vocab lessons', String(lessonsCount)],
          ['Open edits', String(openEditsCount)],
        ].map(([label, value]) => (
          <View
            key={label}
            style={[
              styles.qaMetric,
              {
                backgroundColor: isDarkMode ? colors.surface : '#F6F7F9',
                borderColor: isDarkMode ? colors.border : '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.qaMetricLabel, { color: colors.secondaryText }]}>{label}</Text>
            <Text style={[styles.qaMetricValue, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
      </View>

      {!!qaMessage && (
        <Text style={[styles.qaMessage, { color: colors.success }]}>{qaMessage}</Text>
      )}

      <View style={styles.qaActionRow}>
        <TouchableOpacity onPress={loadQaSnapshot} style={adminSharedStyles.secondaryButton}>
          <Text style={adminSharedStyles.secondaryButtonText}>Reload Counts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearLocalProgress} style={adminSharedStyles.deleteLessonButton}>
          <Text style={adminSharedStyles.deleteLessonButtonText}>Clear Local Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qaMetric: {
    flexGrow: 1,
    flexBasis: 180,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  qaMetricLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  qaMetricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  qaMessage: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
  },
  qaActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Text from '../shared/ThemedText';
import MaterialIcons from '../shared/ThemedMaterialIcon';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../shared/BackButton';
import { useTheme } from '../settings/ThemeContext';
import { useState } from 'react';
import { type AdminTab } from './admin/adminSharedTypes';
import { useChapterLinksAdmin } from './admin/useChapterLinksAdmin';
import { useVocabularyLessonsAdmin } from './admin/useVocabularyLessonsAdmin';
import { useQaSnapshot } from './admin/useQaSnapshot';
import { useAdminPublish } from './admin/useAdminPublish';
import ChapterLinksAdminTab from './admin/ChapterLinksAdminTab';
import VocabularyLessonsAdminTab from './admin/VocabularyLessonsAdminTab';
import CustomChaptersAdminTab from './admin/CustomChaptersAdminTab';
import { useCustomChaptersAdmin } from './admin/useCustomChaptersAdmin';
import QaAdminTab from './admin/QaAdminTab';
import { adminSharedStyles } from './admin/adminSharedStyles';
import { DesktopTypographyProvider } from '../shared/DesktopTypography';
import { getDesktopContentMaxWidth, isDesktopWebWidth } from '../shared/responsiveLayout';

export default function AdminLessonPreviewScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();



  const isWideLayout = width >= 820;
  const isDesktopWeb = isDesktopWebWidth(width);
  const desktopContentMaxWidth = getDesktopContentMaxWidth(width, 'scroll');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('chapterLinks');

  const vocabularyLessonsAdmin = useVocabularyLessonsAdmin();
  const chapterLinksAdmin = useChapterLinksAdmin(vocabularyLessonsAdmin.lessons);
  const customChaptersAdmin = useCustomChaptersAdmin(vocabularyLessonsAdmin.lessons);
  const qaSnapshotAdmin = useQaSnapshot(
    chapterLinksAdmin.chapterLinkOverrides.length,
    vocabularyLessonsAdmin.lessons.length
  );
  const adminPublish = useAdminPublish(
    chapterLinksAdmin.chapterLinkOverrides,
    customChaptersAdmin.chapters,
    vocabularyLessonsAdmin.lessons
  );
  const isContentLoading = chapterLinksAdmin.isLoading
    || customChaptersAdmin.isLoading
    || vocabularyLessonsAdmin.isLoading;

  const openDraftCount = (vocabularyLessonsAdmin.hasLessonDraft ? 1 : 0) + (customChaptersAdmin.hasDraft ? 1 : 0);
  const openEditsCount = chapterLinksAdmin.unsavedChapterLinkCount + openDraftCount;

  return (
    <DesktopTypographyProvider mode="scroll">
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        { paddingTop: insets.top, paddingBottom: insets.bottom + 28 },
        isDesktopWeb && styles.desktopContentWrap,
        isDesktopWeb && { maxWidth: desktopContentMaxWidth },
      ]}
    >
      <BackButton label="Back to Settings" onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.secondaryText }]}>Admin Tools</Text>
        <Text style={[styles.title, { color: colors.text }]}>Content Studio</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Create chapters, update lesson links, and publish vocabulary to every connected install.
        </Text>
      </View>

      <View
        style={[
          adminSharedStyles.statusCard,
          {
            backgroundColor: colors.card,
            borderColor: isDarkMode ? colors.border : 'rgba(31,41,55,0.10)',
          },
        ]}
      >
        <View style={adminSharedStyles.statusHeaderRow}>
          <View style={adminSharedStyles.statusTitleBlock}>
            <Text style={[adminSharedStyles.statusTitle, { color: colors.text }]}>Workspace Status</Text>
            <Text style={[adminSharedStyles.statusSubtitle, { color: colors.secondaryText }]}>
              Publish Live pushes changes to every install immediately. Build Bundle is only for baking them into the next app-store release.
            </Text>
          </View>
          <View style={adminSharedStyles.statusButtonRow}>
            <TouchableOpacity
              onPress={adminPublish.handlePublishLive}
              disabled={adminPublish.isPublishing || adminPublish.baseVersion === null || isContentLoading}
              style={[
                adminSharedStyles.publishLiveButton,
                (adminPublish.isPublishing || adminPublish.baseVersion === null || isContentLoading) && adminSharedStyles.disabledButton,
              ]}
            >
              <MaterialIcons name="publish" size={18} color="#fff" />
              <Text style={adminSharedStyles.buildBundleButtonText}>
                {adminPublish.isPublishing
                  ? 'Publishing...'
                  : adminPublish.baseVersion === null
                    ? 'Connecting...'
                    : isContentLoading
                      ? 'Loading content...'
                      : `Publish Live · v${adminPublish.baseVersion}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={adminPublish.handleCopyBuildJson}
              disabled={adminPublish.buildChangeCount === 0}
              style={[
                adminSharedStyles.buildBundleButton,
                adminPublish.buildChangeCount === 0 && adminSharedStyles.disabledButton,
              ]}
            >
              <MaterialIcons name="ios-share" size={18} color="#fff" />
              <Text style={adminSharedStyles.buildBundleButtonText}>Copy Build Bundle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={adminSharedStyles.statusGrid}>
          <View style={[adminSharedStyles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="link" size={20} color="#1671B6" />
            <View>
              <Text style={[adminSharedStyles.statusMetricValue, { color: colors.text }]}>
                {chapterLinksAdmin.chapterLinkOverrides.length}
              </Text>
              <Text style={[adminSharedStyles.statusMetricLabel, { color: colors.secondaryText }]}>Custom links</Text>
            </View>
          </View>
          <View style={[adminSharedStyles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="post-add" size={20} color="#1671B6" />
            <View>
              <Text style={[adminSharedStyles.statusMetricValue, { color: colors.text }]}>
                {customChaptersAdmin.chapters.length}
              </Text>
              <Text style={[adminSharedStyles.statusMetricLabel, { color: colors.secondaryText }]}>New chapters</Text>
            </View>
          </View>
          <View style={[adminSharedStyles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="library-books" size={20} color="#1671B6" />
            <View>
              <Text style={[adminSharedStyles.statusMetricValue, { color: colors.text }]}>
                {vocabularyLessonsAdmin.lessons.length}
              </Text>
              <Text style={[adminSharedStyles.statusMetricLabel, { color: colors.secondaryText }]}>Custom lessons</Text>
            </View>
          </View>
          <View style={[adminSharedStyles.statusMetric, { backgroundColor: isDarkMode ? colors.surface : '#F6F7F9' }]}>
            <MaterialIcons name="edit-note" size={22} color="#D97706" />
            <View>
              <Text style={[adminSharedStyles.statusMetricValue, { color: colors.text }]}>
                {openEditsCount}
              </Text>
              <Text style={[adminSharedStyles.statusMetricLabel, { color: colors.secondaryText }]}>Open edits</Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          adminSharedStyles.adminTabBar,
          {
            backgroundColor: isDarkMode ? colors.card : '#F6F9FC',
            borderColor: isDarkMode ? colors.border : '#DDE5EE',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveAdminTab('chapterLinks')}
          style={[
            adminSharedStyles.adminTabButton,
            activeAdminTab === 'chapterLinks' && { backgroundColor: colors.buttonBackground },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'chapterLinks' }}
        >
          <MaterialIcons
            name="link"
            size={18}
            color={activeAdminTab === 'chapterLinks' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              adminSharedStyles.adminTabText,
              { color: activeAdminTab === 'chapterLinks' ? colors.buttonText : colors.primary },
            ]}
          >
            Chapter Links
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveAdminTab('customChapters')}
          style={[
            adminSharedStyles.adminTabButton,
            activeAdminTab === 'customChapters' && { backgroundColor: colors.buttonBackground },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'customChapters' }}
        >
          <MaterialIcons
            name="post-add"
            size={18}
            color={activeAdminTab === 'customChapters' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              adminSharedStyles.adminTabText,
              { color: activeAdminTab === 'customChapters' ? colors.buttonText : colors.primary },
            ]}
          >
            New Chapters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveAdminTab('vocabularyLessons')}
          style={[
            adminSharedStyles.adminTabButton,
            activeAdminTab === 'vocabularyLessons' && { backgroundColor: colors.buttonBackground },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'vocabularyLessons' }}
        >
          <MaterialIcons
            name="library-add"
            size={18}
            color={activeAdminTab === 'vocabularyLessons' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              adminSharedStyles.adminTabText,
              { color: activeAdminTab === 'vocabularyLessons' ? colors.buttonText : colors.primary },
            ]}
          >
            Vocabulary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveAdminTab('qa')}
          style={[
            adminSharedStyles.adminTabButton,
            activeAdminTab === 'qa' && { backgroundColor: colors.buttonBackground },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: activeAdminTab === 'qa' }}
        >
          <MaterialIcons
            name="bug-report"
            size={18}
            color={activeAdminTab === 'qa' ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              adminSharedStyles.adminTabText,
              { color: activeAdminTab === 'qa' ? colors.buttonText : colors.primary },
            ]}
          >
            QA
          </Text>
        </TouchableOpacity>
      </View>

      {activeAdminTab === 'qa' && (
        <QaAdminTab {...qaSnapshotAdmin} openEditsCount={openEditsCount} />
      )}

      {activeAdminTab === 'chapterLinks' && (
        <ChapterLinksAdminTab {...chapterLinksAdmin} />
      )}

      {activeAdminTab === 'customChapters' && (
        <CustomChaptersAdminTab
          {...customChaptersAdmin}
          vocabularyLessons={vocabularyLessonsAdmin.lessons}
        />
      )}

      {activeAdminTab === 'vocabularyLessons' && (
        <VocabularyLessonsAdminTab {...vocabularyLessonsAdmin} isWideLayout={isWideLayout} />
      )}
    </ScrollView>
    </DesktopTypographyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContentWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
});

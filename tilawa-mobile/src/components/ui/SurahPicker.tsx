/**
 * SurahPicker Component
 *
 * Modal picker for selecting a Surah before recording.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, screenPadding } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { SURAH_NAMES, getSurahName } from '@/utils/quran';

interface SurahPickerProps {
  visible: boolean;
  selectedSurah: number | null;
  onSelect: (surahNumber: number | null) => void;
  onClose: () => void;
}

interface SurahItem {
  number: number;
  arabic: string;
  english: string;
  transliteration: string;
}

const surahList: SurahItem[] = Object.entries(SURAH_NAMES).map(([num, data]) => ({
  number: parseInt(num, 10),
  ...data,
}));

export const SurahPicker: React.FC<SurahPickerProps> = ({
  visible,
  selectedSurah,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = surahList.filter((surah) => {
    const query = searchQuery.toLowerCase();
    return (
      surah.transliteration.toLowerCase().includes(query) ||
      surah.english.toLowerCase().includes(query) ||
      surah.number.toString().includes(query)
    );
  });

  const handleSelect = useCallback(
    (surahNumber: number) => {
      onSelect(surahNumber);
      onClose();
      setSearchQuery('');
    },
    [onSelect, onClose]
  );

  const handleClear = useCallback(() => {
    onSelect(null);
    onClose();
    setSearchQuery('');
  }, [onSelect, onClose]);

  const renderSurah = useCallback(
    ({ item }: { item: SurahItem }) => {
      const isSelected = selectedSurah === item.number;

      return (
        <Pressable
          onPress={() => handleSelect(item.number)}
          style={[styles.surahItem, isSelected && styles.surahItemSelected]}
        >
          <View style={styles.surahNumber}>
            <Text variant="labelMedium" color={colors.divine.gold}>
              {item.number}
            </Text>
          </View>
          <View style={styles.surahInfo}>
            <Text variant="bodyMedium" color={colors.neutral.white}>
              {item.transliteration}
            </Text>
            <Text variant="labelSmall" color={colors.neutral.gray400}>
              {item.english}
            </Text>
          </View>
          <Text variant="titleMedium" color={colors.neutral.gray300}>
            {item.arabic}
          </Text>
        </Pressable>
      );
    },
    [selectedSurah, handleSelect]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" color={colors.neutral.white}>
            Select Surah
          </Text>
          <Button variant="ghost" size="sm" onPress={onClose}>
            ✕
          </Button>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search surah..."
            placeholderTextColor={colors.neutral.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Clear selection button */}
        {selectedSurah && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text variant="bodySmall" color={colors.semantic.warning}>
              ✕ Clear selection (let AI detect)
            </Text>
          </Pressable>
        )}

        {/* Surah List */}
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurah}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
        />
      </SafeAreaView>
    </Modal>
  );
};

// Compact button to open the picker
interface SurahSelectorButtonProps {
  selectedSurah: number | null;
  onPress: () => void;
}

export const SurahSelectorButton: React.FC<SurahSelectorButtonProps> = ({
  selectedSurah,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress} style={styles.selectorButton}>
      <Text variant="labelSmall" color={colors.neutral.gray400}>
        📖 What will you recite?
      </Text>
      <View style={styles.selectorValue}>
        <Text
          variant="bodyMedium"
          color={selectedSurah ? colors.divine.gold : colors.neutral.gray500}
        >
          {selectedSurah ? getSurahName(selectedSurah) : 'Let AI detect (optional)'}
        </Text>
        <Text variant="bodySmall" color={colors.neutral.gray500}>
          ▼
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sanctuary.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray700,
  },
  searchContainer: {
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.sanctuary.blackLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.neutral.white,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: spacing['4xl'],
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  surahItemSelected: {
    backgroundColor: colors.divine.gold + '20',
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sanctuary.blackLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  surahInfo: {
    flex: 1,
  },
  selectorButton: {
    backgroundColor: colors.sanctuary.blackLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectorValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});

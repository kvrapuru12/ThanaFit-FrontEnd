import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Horizontal inset for tab headers and matching scroll bodies */
export const TAB_SCREEN_HORIZONTAL_PADDING = 16;

/** Space below embedded headers before the next section */
export const TAB_SCREEN_HEADER_MARGIN_BOTTOM = 16;

/** Padding below sticky header (Food) before scroll body starts */
export const TAB_SCREEN_STICKY_SCROLL_PADDING_TOP = 16;

const ACCENTS = {
  coral: { primary: '#ff6b6b', disabledChevron: '#d1d5db' },
  emerald: { primary: '#10b981', disabledChevron: '#d1d5db' },
} as const;

export type TabScreenHeaderAccent = keyof typeof ACCENTS;

/** Top inset for ScrollView content when the header is embedded (not sticky). */
export function tabScreenScrollTopInset(insetsTop: number): number {
  return Math.max(insetsTop, 12) + 8;
}

export interface TabScreenHeaderDateNavConfig {
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenPicker: () => void;
  canGoNextDay: boolean;
  disabled?: boolean;
}

export interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Overrides accent primary for title when set (e.g. Dashboard dark title). */
  titleColor?: string;
  subtitleColor?: string;
  accent?: TabScreenHeaderAccent;
  /**
   * sticky: safe-area top + optional bottom border (header outside ScrollView).
   * embedded: parent scroll applies tabScreenScrollTopInset; no safe-area here.
   */
  placement?: 'sticky' | 'embedded';
  backgroundColor?: string;
  showBottomBorder?: boolean;
  borderBottomColor?: string;
  dateNav?: TabScreenHeaderDateNavConfig;
  /** Rendered after the logo on the right (e.g. Progress “This Week” badge). */
  logoTrailingAccessory?: React.ReactNode;
  logoSize?: number;
}

export function TabScreenHeader({
  title,
  subtitle,
  titleColor,
  subtitleColor = '#6b7280',
  accent = 'coral',
  placement = 'embedded',
  backgroundColor = 'transparent',
  showBottomBorder = false,
  borderBottomColor = '#f3f4f6',
  dateNav,
  logoTrailingAccessory,
  logoSize = 64,
}: TabScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = ACCENTS[accent];
  const resolvedTitleColor = titleColor ?? colors.primary;

  const topPadding = placement === 'sticky' ? Math.max(insets.top, 12) + 8 : 0;
  const bottomPadding = placement === 'sticky' ? 14 : 0;
  const marginBottom = placement === 'embedded' ? TAB_SCREEN_HEADER_MARGIN_BOTTOM : 0;

  return (
    <View
      style={[
        styles.shell,
        {
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          marginBottom,
          paddingHorizontal:
            placement === 'sticky' ? TAB_SCREEN_HORIZONTAL_PADDING : 0,
          backgroundColor,
          borderBottomWidth: showBottomBorder ? 1 : 0,
          borderBottomColor,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.title, { color: resolvedTitleColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
          ) : null}
          {dateNav ? (
            <TabScreenHeaderDateNavRow accent={accent} {...dateNav} hasSubtitle={!!subtitle} />
          ) : null}
        </View>
        <View style={styles.right}>
          <View style={[styles.logoBox, { width: logoSize, height: logoSize }]}>
            <Image
              source={require('../../../assets/logo-icon.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          {logoTrailingAccessory ? (
            <View style={styles.trailingAccessory}>{logoTrailingAccessory}</View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TabScreenHeaderDateNavRow({
  selectedDate,
  onPrevDay,
  onNextDay,
  onOpenPicker,
  canGoNextDay,
  disabled,
  accent,
  hasSubtitle,
}: TabScreenHeaderDateNavConfig & {
  accent: TabScreenHeaderAccent;
  hasSubtitle: boolean;
}) {
  const colors = ACCENTS[accent];
  return (
    <View style={[styles.dateNavRow, { marginTop: hasSubtitle ? 8 : 6 }]}>
      <TouchableOpacity
        accessibilityLabel="Previous day"
        onPress={onPrevDay}
        style={styles.dateArrowButton}
        disabled={disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons
          name="chevron-left"
          size={20}
          color={disabled ? colors.disabledChevron : colors.primary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateTextButton}
        onPress={onOpenPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Open date picker"
      >
        <MaterialIcons name="event" size={16} color={colors.primary} />
        <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel="Next day"
        onPress={() => {
          if (canGoNextDay) onNextDay();
        }}
        style={styles.dateArrowButton}
        disabled={!canGoNextDay || disabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={canGoNextDay ? colors.primary : colors.disabledChevron}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logoBox: {
    flexShrink: 0,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  trailingAccessory: {
    justifyContent: 'center',
    maxWidth: 140,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  dateArrowButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  dateTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    flexShrink: 1,
    minWidth: 0,
  },
});

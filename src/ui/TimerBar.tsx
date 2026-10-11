import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { color } from './tokens';

export type TimerBarProps = {
  /** 1 at the start, 0 at the end. */
  fraction: number;
  /** The closing seconds. */
  warning?: boolean;
  label?: string;
};

/**
 * The discussion clock: a thin bar that shows how much talking time is left
 * without anyone reading digits.
 */
export function TimerBar({ fraction, warning = false, label }: TimerBarProps) {
  const clamped = Math.min(1, Math.max(0, fraction));
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Text variant="overline" tone="muted">
        {(label ?? (warning ? 'Last call' : 'Talk it out')).toUpperCase()}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: warning ? color.brandText : color.text }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, alignSelf: 'stretch' },
  track: { height: 6, borderRadius: 3, backgroundColor: color.timerTrack, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

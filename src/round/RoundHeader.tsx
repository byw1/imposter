import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleButton } from '@/ui/CircleButton';
import { Text } from '@/ui/Text';
import { color, gutter, minTapTarget, space } from '@/ui/tokens';

const STEPS = ['Peek', 'Clues', 'Vote'] as const;

export type RoundStep = (typeof STEPS)[number] | null;

export type RoundHeaderProps = {
  round: number;
  /** Where in the round we are, for the step dots. Null hides them. */
  step: RoundStep;
  onClose: () => void;
  trailing?: ReactNode;
};

/**
 * The bar across the top of every round screen: a way out, the round number,
 * and three quiet steps (peek, clues, vote) so everyone knows how far
 * along the round is.
 */
export function RoundHeader({ round, step, onClose, trailing }: RoundHeaderProps) {
  const at = step ? STEPS.indexOf(step) : -1;
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        <CircleButton icon="close" label="Leave the round" onPress={onClose} />
      </View>
      <View style={styles.center} accessible accessibilityLabel={`Round ${round}${step ? `, ${step}` : ''}`}>
        <Text variant="overline" tone="muted">
          {`ROUND ${round}${step ? ` · ${step.toUpperCase()}` : ''}`}
        </Text>
        {step ? (
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.step, i <= at && styles.stepOn, i === at && styles.stepNow]} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter - 4, paddingVertical: space.sm, gap: space.sm },
  side: { width: minTapTarget },
  trailing: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', gap: 6 },
  steps: { flexDirection: 'row', gap: 4 },
  step: { width: 18, height: 4, borderRadius: 2, backgroundColor: color.timerTrack },
  stepOn: { backgroundColor: color.textMuted },
  stepNow: { backgroundColor: color.brandText, width: 28 },
});

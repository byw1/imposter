import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Icon } from './Icon';
import { Text } from './Text';
import { color, font, holdMs, radius, size, space } from './tokens';

export type HoldToRevealProps = {
  onReveal: () => void;
  onHide: () => void;
  label?: string;
  holdMs?: number;
  style?: StyleProp<ViewStyle>;
};

type Phase = 'rest' | 'holding' | 'open';

/**
 * The big pill that shows a role only while a thumb is on it. A tap is never
 * enough, so a brush of the hand or a curious neighbour can't flip the card.
 *
 * At rest it is glass. Held, lime fills it left to right over `holdMs`; let
 * go early and it drains and shows nothing. Full, it turns solid lime, the
 * card above flips face up, and letting go hides it at once. The haptic at
 * full is the same for every role. Under reduced motion the fill still runs,
 * because it is a timer, not decoration.
 */
export function HoldToReveal({ onReveal, onHide, label = 'Hold to peek', holdMs: duration = holdMs, style }: HoldToRevealProps) {
  const haptics = useHaptics();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const [phase, setPhase] = useState<Phase>('rest');
  const [width, setWidth] = useState(0);
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const phaseRef = useRef<Phase>('rest');

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const value = useRef(0);

  useEffect(() => {
    const id = progress.addListener(({ value: v }) => {
      value.current = v;
    });
    return () => {
      progress.removeListener(id);
      animation.current?.stop();
    };
  }, [progress]);

  const press = () => {
    animation.current?.stop();
    go('holding');
    animation.current = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(1, duration * (1 - value.current)),
      easing: reduced ? Easing.linear : Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });
    animation.current.start(({ finished }) => {
      if (!finished || phaseRef.current !== 'holding') return;
      go('open');
      haptics.reveal();
      onReveal();
    });
  };

  const release = () => {
    animation.current?.stop();
    const was = phaseRef.current;
    go('rest');
    if (was === 'open') {
      // Hidden first, before any animation: a role is never left showing.
      onHide();
      progress.setValue(0);
      return;
    }
    animation.current = Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: false });
    animation.current.start();
  };

  const text = phase === 'open' ? 'Let go to hide' : phase === 'holding' ? 'Keep holding' : label;
  const content = (ink: string) => (
    <View style={styles.content}>
      <Icon name="hand" size={20} color={ink} />
      <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPressIn={press}
      onPressOut={release}
      accessibilityRole="button"
      accessibilityLabel="Hold to see your role"
      accessibilityHint="Double-tap and hold. Let go to hide it again."
      style={style}
    >
      <View
        style={[styles.pill, phase === 'open' && styles.pillOpen]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {content(phase === 'open' ? color.ink : color.text)}
        {phase !== 'open' ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fill,
              { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) },
            ]}
          >
            {/* The same label in ink, revealed by the fill, so it reads on lime. */}
            <View style={[styles.fillInner, { width }]}>{content(color.ink)}</View>
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: size.buttonLg,
    borderRadius: radius.pill,
    backgroundColor: color.glass,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillOpen: { backgroundColor: color.brand },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg },
  label: { fontFamily: font.heavy, fontSize: 18, lineHeight: 22 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: color.brand },
  fillInner: { position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' },
});

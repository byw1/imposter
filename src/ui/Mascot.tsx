import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { color, font, palette } from './tokens';

export type MascotMood = 'smirk' | 'peek' | 'excited' | 'gasp' | 'caught' | 'sleepy' | 'wink';

export type MascotProps = {
  mood?: MascotMood;
  size?: number;
  /** Bob, peeks over the shades, glances and card wobbles. Off for small inline uses. */
  animated?: boolean;
  /** The glyph on the forehead card. Shade doesn't know the word, so it's a question mark. */
  glyph?: string;
  /** Tap Shade and Shade reacts. Off by default, because Shade often sits inside a button. */
  poke?: boolean;
};

const INK = color.ink;
const CHEEK = palette.cheek;

/** The art is drawn on a 120-unit grid with room for the sticker border all round. */
const VIEW = '-6 -6 132 132';
const UNITS = 132;

/** Where the card pivots: the middle of its bottom edge, stuck to the head. */
const CARD_PIVOT = { x: 64 + 6, y: 55 + 6 };
/** Where the shades pivot when they're knocked crooked. */
const SHADES_PIVOT = { x: 60 + 6, y: 80 + 6 };

/** How far the shades sit down the nose, in art units, and how crooked. */
const SHADES: Record<MascotMood, { drop: number; tilt: number } | null> = {
  smirk: { drop: 0, tilt: 0 },
  peek: { drop: 9, tilt: 0 },
  excited: { drop: 0, tilt: 0 },
  gasp: { drop: 0, tilt: -3 },
  caught: { drop: 12, tilt: -16 },
  sleepy: null,
  wink: { drop: 9, tilt: 0 },
};

/**
 * Shade, the imposter. Drawn exactly like Dex from Charades: a round sticker
 * head with a thick white border, an ink outline, flat colour, a soft
 * highlight, blush and a card stuck to its forehead. Two things change: the
 * head is red, and Shade wears dark shades. That's the whole spy costume, and
 * the name. The forehead card is lime with a question mark, tilted the other
 * way from Dex's: everyone else knows the word, Shade doesn't.
 *
 * Shade is alive: a squashy bob, and every so often the shades slide down the
 * nose for a peek, eyes darting sideways, then back up. The card wobbles. All
 * of it stops under reduced motion.
 */
export function Mascot({ mood: moodProp = 'smirk', size = 120, animated = true, glyph = '?', poke = false }: MascotProps) {
  const reduced = useReducedMotion();
  const live = animated && !reduced;

  const [bob] = useState(() => new Animated.Value(0));
  const [wiggle] = useState(() => new Animated.Value(0));
  const [boing] = useState(() => new Animated.Value(0));
  const [slide] = useState(() => new Animated.Value(SHADES[moodProp]?.drop ?? 0));
  const [peeking, setPeeking] = useState(false);
  const [look, setLook] = useState(0);
  const [poked, setPoked] = useState(false);

  const mood: MascotMood = poked ? 'excited' : peeking && moodProp === 'smirk' ? 'peek' : moodProp;
  const shades = SHADES[mood];
  const k = size / UNITS;

  // The shades follow the mood: down the nose to peek, crooked when caught.
  useEffect(() => {
    const target = shades?.drop ?? 0;
    if (!live) {
      slide.setValue(target);
      return;
    }
    const animation = Animated.spring(slide, { toValue: target, friction: 7, tension: 90, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [live, shades?.drop, slide]);

  // The bounce. Excited is quick and high, sleepy is slow breathing.
  useEffect(() => {
    if (!live) {
      bob.setValue(0);
      return;
    }
    const speed = mood === 'excited' ? 340 : mood === 'sleepy' ? 1700 : 900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: speed, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: speed, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, live, mood]);

  // Now and then the card wobbles on its forehead.
  useEffect(() => {
    if (!live || mood === 'sleepy') return;
    const wobble = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(wiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -0.8, duration: 150, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0.4, duration: 130, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(2100),
      ]),
    );
    wobble.start();
    return () => wobble.stop();
  }, [live, mood, wiggle]);

  // A smirking Shade sneaks a peek over the shades every few seconds.
  useEffect(() => {
    if (!live || moodProp !== 'smirk') return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(
        () => {
          setPeeking(true);
          timeout = setTimeout(() => {
            setPeeking(false);
            schedule();
          }, 1500);
        },
        2600 + Math.random() * 3000,
      );
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [live, moodProp]);

  // Shifty eyes: left, right, back.
  useEffect(() => {
    if (!live) return;
    let timeout: ReturnType<typeof setTimeout>;
    const glance = () => {
      timeout = setTimeout(
        () => {
          setLook((current) => (current !== 0 ? 0 : Math.random() < 0.5 ? -1 : 1));
          glance();
        },
        500 + Math.random() * 900,
      );
    };
    glance();
    return () => clearTimeout(timeout);
  }, [live]);

  const onPoke = () => {
    if (reduced) return;
    setPoked(true);
    boing.setValue(0);
    Animated.sequence([
      Animated.spring(boing, { toValue: 1, friction: 3, tension: 220, useNativeDriver: true }),
      Animated.timing(boing, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setPoked(false));
  };

  const lift = (mood === 'excited' ? 10 : mood === 'sleepy' ? 1.5 : 4) * k;
  const squash = mood === 'sleepy' ? 0.015 : mood === 'excited' ? 0.06 : 0.035;

  const body = {
    transform: [
      { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -lift] }) },
      { scaleX: bob.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1 + squash, 1, 1 - squash / 2] }) },
      { scaleY: bob.interpolate({ inputRange: [0, 0.25, 1], outputRange: [1 - squash, 1, 1 + squash / 2] }) },
      { scale: boing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
      { rotate: boing.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) },
    ],
  };

  const card = {
    transformOrigin: `${(CARD_PIVOT.x / UNITS) * 100}% ${(CARD_PIVOT.y / UNITS) * 100}%`,
    transform: [
      {
        rotate: Animated.add(wiggle, boing.interpolate({ inputRange: [0, 1], outputRange: [0, 2] })).interpolate({
          inputRange: [-1, 0, 1, 2],
          outputRange: ['-7deg', '0deg', '7deg', '-30deg'],
        }),
      },
    ],
  };

  const shadesLayer = {
    transformOrigin: `${(SHADES_PIVOT.x / UNITS) * 100}% ${(SHADES_PIVOT.y / UNITS) * 100}%`,
    transform: [{ translateY: Animated.multiply(slide, k) }, { rotate: `${shades?.tilt ?? 0}deg` }],
  };

  const art = (
    <Animated.View style={[styles.fill, body]}>
      <Svg width={size} height={size} viewBox={VIEW}>
        {/* The sticker border round the head and the card. */}
        <G fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={12} strokeLinejoin="round">
          <Ellipse cx={60} cy={73} rx={42} ry={39} />
          <G transform="rotate(9 60 30)">
            <Rect x={40} y={5} width={40} height={50} rx={9} />
          </G>
        </G>

        <Ellipse cx={60} cy={73} rx={42} ry={39} fill={palette.red} stroke={INK} strokeWidth={3.5} />
        <Ellipse cx={60} cy={86} rx={30} ry={20} fill="#FFFFFF" opacity={0.08} />
        <Ellipse cx={34} cy={60} rx={5} ry={9} fill="#FFFFFF" opacity={0.28} transform="rotate(20 34 60)" />

        <Ellipse cx={30} cy={95} rx={8} ry={5} fill={CHEEK} opacity={0.9} />
        <Ellipse cx={90} cy={95} rx={8} ry={5} fill={CHEEK} opacity={0.9} />

        <Eyes mood={mood} look={look} />
        <Mouth mood={mood} />
      </Svg>

      {shades ? (
        <Animated.View style={[StyleSheet.absoluteFill, shadesLayer]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={VIEW}>
            <Shades />
          </Svg>
        </Animated.View>
      ) : null}

      <Animated.View style={[StyleSheet.absoluteFill, card]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={VIEW}>
          <G transform="rotate(9 60 30)">
            <Rect x={40} y={5} width={40} height={50} rx={9} fill={palette.lime} stroke={INK} strokeWidth={4} />
            <SvgText
              x={60}
              y={42}
              fontSize={[...glyph].length > 1 ? 18 : /\p{Extended_Pictographic}/u.test(glyph) ? 24 : 32}
              fontFamily={font.display}
              fontWeight="800"
              fill={INK}
              textAnchor="middle"
            >
              {glyph}
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      {mood === 'sleepy' && live ? <Snooze size={size} /> : null}
    </Animated.View>
  );

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Shade, the Imposter mascot"
    >
      {poke ? (
        <Pressable onPress={onPoke} style={styles.fill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {art}
        </Pressable>
      ) : (
        art
      )}
    </View>
  );
}

/** Dark shades with a white glint on each lens. */
function Shades() {
  return (
    <G>
      <Rect x={29} y={73} width={27} height={15} rx={7} fill={INK} />
      <Rect x={64} y={73} width={27} height={15} rx={7} fill={INK} />
      <Path d="M56 77 Q60 74.5 64 77" stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Path d="M34 77.5 L39.5 76" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M69 77.5 L74.5 76" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Three z's drifting up and away, staggered. */
function Snooze({ size }: { size: number }) {
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(drift, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [drift]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0, 1, 2].map((i) => {
        const phase = Animated.modulo(Animated.add(drift, i / 3), 1);
        return (
          <Animated.Text
            key={i}
            style={[
              styles.z,
              {
                fontSize: size * (0.12 + i * 0.03),
                right: size * 0.02,
                top: size * 0.3,
                opacity: phase.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 0.8, 0] }),
                transform: [
                  { translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.35] }) },
                  { translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.12] }) },
                ],
              },
            ]}
          >
            z
          </Animated.Text>
        );
      })}
    </View>
  );
}

const line = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

/**
 * Eyes only show when the shades are down the nose: on a peek, a wink, when
 * caught, and asleep. A smirking Shade's eyes are hidden, which is the point.
 */
function Eyes({ mood, look }: { mood: MascotMood; look: number }) {
  const eye = (cx: number, cy: number) => (
    <G key={cx}>
      <Ellipse cx={cx} cy={cy} rx={5.5} ry={6.5} fill={INK} />
      <Circle cx={cx + 1.8} cy={cy - 2.5} r={2} fill="#FFFFFF" />
    </G>
  );

  switch (mood) {
    case 'peek': {
      // Darting sideways, mostly toward whoever is talking.
      const dx = look === 0 ? 3.5 : look * 3.5;
      return (
        <G>
          {eye(44 + dx, 72)}
          {eye(76 + dx, 72)}
        </G>
      );
    }
    case 'wink':
      return (
        <G>
          {eye(44, 72)}
          <Path d="M70 73 Q76 67 82 73" {...line} />
        </G>
      );
    case 'caught':
      return (
        <G>
          {eye(44, 74)}
          {eye(76, 74)}
        </G>
      );
    case 'sleepy':
      return <Path d="M37 82 Q44 87 51 82 M69 82 Q76 87 83 82" {...line} />;
    default:
      return null;
  }
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case 'excited':
      return (
        <G>
          <Path d="M50 96 Q60 110 70 96 Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <Ellipse cx={60} cy={103.5} rx={5} ry={3} fill={CHEEK} />
        </G>
      );
    case 'gasp':
      return <Ellipse cx={60} cy={101} rx={4.5} ry={5.5} fill={INK} />;
    case 'caught':
      return <Path d="M53 105 Q60 100 67 105" {...line} strokeWidth={3.5} />;
    case 'peek':
      return <Path d="M54 103 L66 102" {...line} strokeWidth={3.5} />;
    case 'sleepy':
      return <Ellipse cx={60} cy={100} rx={3} ry={3.5} fill={INK} />;
    case 'smirk':
    case 'wink':
      return <Path d="M51 100 Q60 105 69 97" {...line} strokeWidth={3.5} />;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  z: { position: 'absolute', fontFamily: font.display, color: '#FFFFFF' },
});

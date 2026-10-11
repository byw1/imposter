import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { eyeParts, headParts, mouthParts, SHADE, type MascotMood, type Part } from './shadeFace';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { font } from './tokens';

export type { MascotMood };

export type MascotProps = {
  mood?: MascotMood;
  size?: number;
  /** Bob, blinks, shifty glances and card wobbles. Off for small inline uses. */
  animated?: boolean;
  /** The glyph on the forehead card. Shade doesn't know the word, so it's a question mark. */
  glyph?: string;
  /** Tap Shade and Shade reacts. Off by default, because Shade often sits inside a button. */
  poke?: boolean;
};

/** The art is drawn on a 120-unit grid with room for the sticker border all round. */
const VIEW = '-6 -6 132 132';
const UNITS = 132;

/** Where the card pivots: the middle of its bottom edge, stuck to the head. */
const CARD_PIVOT = { x: 64 + 6, y: 55 + 6 };

/**
 * Shade, the imposter. Drawn exactly like Dex from Charades: a round sticker
 * head with a thick white border, an ink outline, flat colour, a soft
 * highlight, blush and a card stuck to its forehead. The head is red, and the
 * eyes are shady: heavy half-shut lids and a sideways look. The forehead card
 * is lime with a question mark, tilted the other way from Dex's: everyone else
 * knows the word, Shade doesn't.
 *
 * Shade is alive: a squashy bob, blinks, and eyes that dart about; every so
 * often a smirking Shade narrows its eyes for a shifty look round the table.
 * The card wobbles. All of it stops under reduced motion. The face itself
 * lives in shadeFace.ts, shared with the design system's static art.
 */
export function Mascot({ mood: moodProp = 'smirk', size = 120, animated = true, glyph = '?', poke = false }: MascotProps) {
  const reduced = useReducedMotion();
  const live = animated && !reduced;

  const [bob] = useState(() => new Animated.Value(0));
  const [wiggle] = useState(() => new Animated.Value(0));
  const [boing] = useState(() => new Animated.Value(0));
  const [peeking, setPeeking] = useState(false);
  const [look, setLook] = useState(0);
  const [poked, setPoked] = useState(false);
  const [blinking, setBlinking] = useState(false);

  const mood: MascotMood = poked ? 'excited' : peeking && moodProp === 'smirk' ? 'peek' : moodProp;
  const k = size / UNITS;

  // Blinks, at a human, uneven rhythm.
  useEffect(() => {
    if (!live) return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(
        () => {
          setBlinking(true);
          timeout = setTimeout(() => {
            setBlinking(false);
            schedule();
          }, 130);
        },
        2400 + Math.random() * 2600,
      );
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [live]);

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

  // A smirking Shade narrows its eyes for a shifty look every few seconds.
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

        {headParts().map(draw)}
        <Ellipse cx={34} cy={60} rx={5} ry={9} fill="#FFFFFF" opacity={0.28} transform="rotate(20 34 60)" />
        {eyeParts(mood, look, blinking).map(draw)}
        {mouthParts(mood).map(draw)}
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, card]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={VIEW}>
          <G transform="rotate(9 60 30)">
            <Rect x={40} y={5} width={40} height={50} rx={9} fill={SHADE.card} stroke={SHADE.ink} strokeWidth={4} />
            <SvgText
              x={60}
              y={42}
              fontSize={[...glyph].length > 1 ? 18 : /\p{Extended_Pictographic}/u.test(glyph) ? 24 : 32}
              fontFamily={font.display}
              fontWeight="800"
              fill={SHADE.ink}
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

/** One shape from shadeFace.ts, as a react-native-svg element. */
function draw(part: Part, i: number) {
  switch (part.tag) {
    case 'ellipse':
      return <Ellipse key={i} {...strip(part)} />;
    case 'circle':
      return <Circle key={i} {...strip(part)} />;
    case 'path':
      return <Path key={i} {...strip(part)} strokeLinecap="round" strokeLinejoin="round" />;
  }
}

function strip<T extends { tag: string }>(part: T): Omit<T, 'tag'> {
  const { tag: _tag, ...rest } = part;
  return rest;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  z: { position: 'absolute', fontFamily: font.display, color: '#FFFFFF' },
});

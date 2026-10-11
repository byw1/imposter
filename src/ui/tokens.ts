import type { TopicColor } from '@/game/types';

/**
 * Design tokens, from the Imposter design system.
 *
 * Quiet, then loud. Imposter is Charades' sibling: the same near-black
 * camera-app canvas, the same fat pills, the same two typefaces and the same
 * sticker character. What changes is the mood. Most of the game is hushed and
 * dark, and colour is saved for two moments: your secret, and the verdict.
 *
 * One acid lime means "do the thing". Red is Shade, the imposter, and the
 * imposter winning. Blue is the table catching them. Neither is ever a topic
 * colour, so a role card never looks like a result.
 */

export const palette = {
  lime: '#C8FF2E',
  limeDeep: '#A6DC0A',
  red: '#FF4560',
  redDeep: '#E02A47',
  blue: '#2EA8FF',
  blueDeep: '#1388E0',

  purple: '#9B5CFF',
  teal: '#00C2B2',
  yellow: '#FFE500',
  orange: '#FF6B2C',
  indigo: '#5B5BFF',
  magenta: '#E040FB',

  cheek: '#FFB0BF',
} as const;

/** Which way the menus are painted. Role cards and verdicts look the same in both. */
export type Scheme = 'dark' | 'light';
/** The setting: a fixed scheme, or whatever the phone is set to. */
export type ThemeChoice = Scheme | 'system';

const dark = {
  /** Charades' near-black, nudged toward plum so the game feels like after dark. */
  background: '#0C0A10',
  /** Rows, player chips, topic tiles, inputs and unselected chips. */
  surface: '#17141D',
  /** Something on a surface, a pressed surface, a disabled button, a face-down RoleCard. */
  surfaceRaised: '#221E2A',
  /** Hairlines. Decorative only. */
  line: '#2D2837',
  /** The tab bar and the frame around a round. */
  chrome: '#000000',
  chromeIdle: 'rgba(255,255,255,0.5)',

  glass: 'rgba(255,255,255,0.12)',
  glassStrong: 'rgba(255,255,255,0.2)',
  scrim: 'rgba(0,0,0,0.45)',

  text: '#FFFFFF',
  textMuted: '#A8A3B5',
  /** Disabled labels and placeholders only. */
  textFaint: '#6C677A',

  bone: '#FFFFFF',
  ink: '#0C0A10',

  /** The one accent: Start game, Reveal, Lock vote. One per screen, with ink on top. */
  brand: palette.lime as string,
  brandDeep: palette.limeDeep as string,
  /** The accent as text or a ring on the canvas. */
  brandText: palette.lime as string,

  /** The table caught the imposter. A full-screen fill, never text. */
  caught: palette.blue as string,
  /** The imposter won. Shade's colour: the screen turns into them. */
  escaped: palette.red as string,
  danger: palette.red as string,
  focus: palette.blue as string,

  gold: '#FFC93C',
  silver: '#C9CED8',
  bronze: '#E3A06A',

  /** The censor bar. Always ink, in both themes. */
  redact: '#0C0A10',
  /** The dark strip on a RoleCard that holds the instruction line. */
  hintStrip: 'rgba(12,10,16,0.82)',
  hintLabel: palette.lime as string,
  cardBlob: 'rgba(255,255,255,0.08)',
  timerTrack: 'rgba(255,255,255,0.14)',
  /** The drifting censor bars behind the Play screen. Faint, so text on top still reads. */
  pattern: 'rgba(255,255,255,0.05)',
};

export type ColorSet = { [K in keyof typeof dark]: string };

/**
 * Light: for daytime and outdoor play. Only the canvas, text and hairlines
 * flip, and the accent darkens where it is text or a ring.
 */
const light: ColorSet = {
  ...dark,
  background: '#F3F1F4',
  surface: '#FFFFFF',
  surfaceRaised: '#E7E4EA',
  line: '#D8D4DC',
  chrome: '#FFFFFF',
  chromeIdle: 'rgba(12,10,16,0.45)',
  glass: 'rgba(12,10,16,0.07)',
  glassStrong: 'rgba(12,10,16,0.12)',
  text: '#0C0A10',
  textMuted: '#5E5A69',
  textFaint: '#8D8996',
  brandText: '#4A6400',
  focus: '#0B84DB',
  timerTrack: 'rgba(12,10,16,0.1)',
  pattern: 'rgba(12,10,16,0.05)',
};

export const themes: Record<Scheme, ColorSet> = { dark, light };

/**
 * The scheme, decided once at launch. Styles are built once when their file
 * loads, so the theme has to be known before any of them are; changing it
 * reloads the app (see useSettings). Anywhere without native modules, such as
 * the logic tests, gets dark.
 */
function launchScheme(): Scheme {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must run before any style is built
    const Storage = (require('expo-sqlite/kv-store') as { default: { getItemSync(key: string): string | null } }).default;
    const raw = Storage.getItemSync('settings.v1');
    const choice = raw ? (JSON.parse(raw) as { theme?: unknown }).theme : undefined;
    if (choice === 'light' || choice === 'dark') return choice;
    if (choice !== 'system') return 'dark';
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
    const { Appearance } = require('react-native') as typeof import('react-native');
    return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const scheme: Scheme = launchScheme();

export const color: ColorSet = themes[scheme];

/** Topic and player colours. Never red or blue: those are verdicts. */
export const topicColors: Record<TopicColor, string> = {
  purple: palette.purple,
  teal: palette.teal,
  yellow: palette.yellow,
  orange: palette.orange,
  indigo: palette.indigo,
  magenta: palette.magenta,
};

/** Text on a topic colour: ink on all of them except indigo, which takes bone. */
export function inkOn(topic: TopicColor): string {
  return topic === 'indigo' ? color.bone : color.ink;
}

/**
 * Two faces, shared with Charades. Bricolage Grotesque for anything said out
 * loud: the secret word, names on the hand-off, titles, the verdict. Plus
 * Jakarta Sans for everything read.
 */
export const font = {
  display: 'BricolageGrotesque_800ExtraBold',
  regular: 'PlusJakartaSans_500Medium',
  medium: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  hero: { fontFamily: font.display, fontSize: 44, lineHeight: 46, letterSpacing: -1.2 },
  display: { fontFamily: font.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.8 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  stat: { fontFamily: font.display, fontSize: 28, lineHeight: 32 },
  heading: { fontFamily: font.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: font.heavy, fontSize: 12, lineHeight: 16, letterSpacing: 0.8 },
} as const;

/** Four-point grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const gutter = 16;
export const minTapTarget = 44;
export const ringWidth = 3;

export const size = {
  buttonLg: 58,
  buttonMd: 50,
  buttonSm: 42,
  avatarMd: 44,
  avatarLg: 72,
} as const;

/** How long a player holds to see their role: a brush of the thumb never shows it. */
export const holdMs = 600;
/** How long the verdict owns the screen before the recap. */
export const verdictMs = 1600;

export type ColorToken = keyof ColorSet;

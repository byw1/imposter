/**
 * Identifiers for sessions, rounds, players and custom topics. Short random hex
 * with a prefix, so an id says what it is when it turns up in a log.
 */

export type RandomSource = () => number;

function randomHex(random: RandomSource): string {
  return Math.floor(random() * 0x100000000)
    .toString(16)
    .padStart(8, '0')
    .slice(0, 8);
}

export const makeSessionId = (random: RandomSource = Math.random) => `ses_${randomHex(random)}`;
export const makeRoundId = (random: RandomSource = Math.random) => `rnd_${randomHex(random)}`;
export const makePlayerId = (random: RandomSource = Math.random) => `ply_${randomHex(random)}`;
export const makeTopicId = (random: RandomSource = Math.random) => `top_${randomHex(random)}`;

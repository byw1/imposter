# Imposter

A hidden-word party game for 3 to 12 players on one phone. Everyone gets the
same secret word except the imposters, who see only the topic (or nothing, in
hard mode). Players give one-word clues in turn, talk, and vote. If the table
votes out an imposter, that imposter gets one guess at the word to steal the
win.

The genre is crowded and one famous game sits next to it. We don't name,
compare against or borrow from any of them: our roles are **in** and **the
imposter**, our phases are **clues**, **talk it out** and **vote**, and Shade is
a round sticker head with shady, half-shut eyes. See the design system's Legal guardrails.

---

## Non-negotiables

1. **Fully offline.** Zero network calls, no accounts, no sign-in. Enforced by
   a lint rule and `src/noNetwork.test.ts`.
2. **No analytics, no ads, no tracking.** No permissions asked for at all.
3. **All content free.** Every topic from install.
4. **Nothing leaks a role.** Every RoleCard in a round is the topic colour,
   with the same layout, the same reveal sound and haptic, and the same time on
   screen. Releasing the hold covers the card at once. Shade never appears on a
   RoleCard.
5. **Nothing is lost.** Players, rules, custom topics, stats and the game in
   progress persist on the phone. Saved data is validated when read back.

## Stack

Expo (managed) + React Native + TypeScript strict, Expo Router, zustand,
`expo-sqlite/kv-store`, `expo-haptics`, `expo-audio`, `expo-keep-awake`. EAS
Build and Submit for iOS.

**Hard rule:** everything in `/src/game` is pure TypeScript with no React or
React Native imports.

## Rules

- **Players:** 3 to 12, unique names (ignoring case), in seating order.
- **Imposters:** up to 4 players, 1; 5 to 7, up to 2; 8 or more, up to 3.
  *Surprise* picks 1 most of the time, and more only sometimes.
- **The deal:** a word nobody has seen tonight from the chosen topics (all
  topics if none chosen), until every word is used. Imposters are picked
  uniformly. Clue order keeps the seating and starts from a random seat.
- **Clues:** each player gives one word, going round `clueRounds` times.
- **Talk:** a timer bar for `talkSeconds`, with +30s; 0 skips to the vote.
- **Vote (point):** everyone points on three; the host taps the most-pointed
  player.
- **Vote (secret):** each player votes privately, never for themselves. Most
  votes is voted out. A tie revotes between the tied players; a tied revote is
  a deadlock and the imposters get away.
- **Outcome:** voting out an imposter is *caught*, and that imposter then picks
  the word from up to 8 words of the same topic; a right pick is *stolen*.
  Voting out someone who was in, or a deadlock, is *escaped* ("Got away").

### Points

| Outcome | Points |
| --- | --- |
| Caught | 1 to everyone who was in; +1 detective bonus for a secret vote on an imposter |
| Got away | 2 to each imposter |
| Stole it | 2 to each imposter, +1 to the one who guessed |

## Data

```ts
type Player = { id: string; name: string; color: TopicColor }
type Topic = { id: string; name: string; emoji: string; color: TopicColor; words: string[]; builtIn: boolean }
type GameSettings = {
  imposters: 1 | 2 | 3 | 'surprise'
  hint: boolean
  clueRounds: number         // 1–3
  talkSeconds: number        // 0 = no timer
  voteMode: 'point' | 'secret'
  topicIds: string[]         // empty = all
}
type Round = {
  id: string; number: number
  topicId: string; topicName: string; topicEmoji: string; topicColor: TopicColor
  word: string
  imposterIds: string[]
  order: string[]                 // clue order
  votes: Record<string, string>   // secret votes, voter → suspect
  accusedId: string | null
  guess: string | null
  outcome: 'caught' | 'escaped' | 'stolen' | null
  points: Record<string, number>
  startedAt: string; endedAt: string | null
}
type Session = { id: string; createdAt: string; players: Player[]; settings: GameSettings; rounds: Round[]; usedWords: string[] }
```

Finished rounds are also kept as small records by player name (`RoundRecord`
in `src/game/stats.ts`) for the stats on the You page, because the same friends
come back on a new night with new ids.

Storage keys: `settings.v1`, `table.v1`, `topics.v1`, `game.v1`, `history.v1`.

## Screens

| Route | What |
| --- | --- |
| `/` | Home: Topics, Play, You, swiped like Charades |
| `/welcome` | How to play, as stories |
| `/new/players`, `/new/rules` | The table and house rules |
| `/round/deal` | Pass and peek: HandOff, RoleCard, HoldToReveal |
| `/round/clues` | TurnOrder |
| `/round/talk` | TimerBar |
| `/round/vote` | VoteCards, point or secret |
| `/round/reveal` | Drumroll and the censor bar |
| `/round/guess` | The steal |
| `/round/verdict` | VerdictFlash |
| `/round/recap` | The word, points, tonight's table |
| `/topics/[id]`, `/topics/edit/[id]` | A topic's words; the topic editor |
| `/settings` | Look, sound, haptics |

## Design

Built from the Imposter design system: the tokens in `src/ui/tokens.ts`, the
components (RoleCard, HoldToReveal, HandOff, PlayerChip, TurnOrder, VoteCard,
TopicTile, TimerBar, VerdictFlash, StatTile, Button, Chip, CircleButton,
EmojiSticker) and Shade in `src/ui/Mascot.tsx`. Lime appears once per screen.
Blue (caught) and red (escaped) are verdict fills and never topic colours.

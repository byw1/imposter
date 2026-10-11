import { awards, playerStats, recordRound, totals, type RoundRecord } from './stats';
import type { Player, Round } from './types';

const players: Player[] = ['Maya', 'Jordan', 'Sam'].map((name, i) => ({ id: `p${i}`, name, color: 'teal' }));

const rec = (over: Partial<RoundRecord>): RoundRecord => ({
  at: '2026-10-10T21:00:00Z',
  word: 'Pizza',
  topic: 'Food',
  outcome: 'caught',
  players: ['Maya', 'Jordan', 'Sam'],
  imposters: ['Sam'],
  accused: 'Sam',
  votes: {},
  ...over,
});

describe('stats', () => {
  it('turns a finished round into a record by name, and skips an open one', () => {
    const round: Round = {
      id: 'r',
      number: 1,
      topicId: 'food',
      topicName: 'Food',
      topicEmoji: '🍕',
      topicColor: 'orange',
      word: 'Pizza',
      imposterIds: ['p2'],
      order: ['p0', 'p1', 'p2'],
      votes: { p0: 'p2' },
      accusedId: 'p2',
      guess: null,
      outcome: 'caught',
      points: {},
      startedAt: 'a',
      endedAt: 'b',
    };
    expect(recordRound(round, { players })).toMatchObject({ imposters: ['Sam'], accused: 'Sam', votes: { Maya: 'Sam' }, at: 'b' });
    expect(recordRound({ ...round, outcome: null }, { players })).toBeNull();
  });

  it('counts per player, matching names across nights ignoring case', () => {
    const records = [
      rec({ votes: { Maya: 'Sam' } }),
      rec({ outcome: 'escaped', accused: 'Maya', players: ['maya', 'Jordan', 'Sam'] }),
      rec({ outcome: 'stolen' }),
    ];
    const byName = Object.fromEntries(playerStats(records).map((s) => [s.name.toLowerCase(), s]));
    expect(byName.maya).toMatchObject({ rounds: 3, caught: 1, sleuthed: 1, imposter: 0 });
    expect(byName.sam).toMatchObject({ imposter: 3, busted: 1, gotAway: 1, stole: 1 });
  });

  it('totals rounds, outcomes and nights', () => {
    const t = totals([rec({}), rec({ outcome: 'escaped', at: '2026-10-11T21:00:00Z' }), rec({ outcome: 'stolen' })]);
    expect(t).toEqual({ rounds: 3, caught: 1, gotAway: 1, stolen: 1, nights: 2 });
  });

  it('hands out awards only when someone earned them', () => {
    expect(awards([])).toEqual([]);
    const prizes = awards(playerStats([rec({ outcome: 'escaped' }), rec({ outcome: 'stolen' }), rec({ votes: { Jordan: 'Sam' } })]));
    expect(prizes.map((p) => [p.title, p.name])).toEqual([
      ['Best liar', 'Sam'],
      ['Best detective', 'Jordan'],
      ['Word thief', 'Sam'],
    ]);
  });
});

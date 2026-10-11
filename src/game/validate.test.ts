import { parsePlayers, parseRecords, parseSession, parseSettings, parseTopics } from './validate';
import { DEFAULT_SETTINGS } from './types';

describe('reading saved data', () => {
  it('falls back to defaults for junk settings, and repairs out-of-range values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ imposters: 7, clueRounds: 9, talkSeconds: -1, voteMode: 'shout', hint: 'yes' })).toEqual({
      ...DEFAULT_SETTINGS,
      topicIds: [],
    });
    expect(parseSettings({ imposters: 'surprise', voteMode: 'secret', hint: false }).imposters).toBe('surprise');
  });

  it('drops broken and duplicate players and fixes unknown colours', () => {
    const players = parsePlayers([{ id: 'a', name: 'Maya', color: 'red' }, { id: 'a', name: 'Again' }, { name: 'No id' }, 'junk']);
    expect(players).toEqual([{ id: 'a', name: 'Maya', color: 'purple' }]);
  });

  it('keeps custom topics as custom, whatever they claim', () => {
    expect(parseTopics([{ id: 't', name: 'Ours', words: ['A', 3, 'B'], builtIn: true }])).toEqual([
      { id: 't', name: 'Ours', emoji: '🎲', color: 'purple', words: ['A', 'B'], builtIn: false },
    ]);
  });

  it('rejects a session without enough players', () => {
    expect(parseSession({ id: 's', players: [{ id: 'a', name: 'A' }] })).toBeNull();
  });

  it('reads back a session', () => {
    const session = parseSession({
      id: 's',
      createdAt: 'now',
      players: [
        { id: 'a', name: 'A', color: 'teal' },
        { id: 'b', name: 'B', color: 'teal' },
        { id: 'c', name: 'C', color: 'teal' },
      ],
      settings: {},
      rounds: [{ id: 'r', word: 'Pizza', imposterIds: ['a'], order: ['a', 'b', 'c'], outcome: 'nope', votes: { a: 'b', b: 4 } }],
      usedWords: ['Pizza'],
    });
    expect(session?.rounds[0]).toMatchObject({ outcome: null, votes: { a: 'b' }, accusedId: null });
  });

  it('keeps only well-formed history', () => {
    expect(parseRecords([{ at: 'x', players: ['A'], imposters: ['A'], outcome: 'caught' }, { at: 'y' }])).toHaveLength(1);
  });
});

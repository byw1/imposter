import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { nameProblem } from '@/game/players';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from '@/game/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useTableStore } from '@/hooks/useTable';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { CircleButton } from '@/ui/CircleButton';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { PopIn } from '@/ui/motion';
import { Footer, Screen } from '@/ui/Screen';
import { SetupHeader } from '@/ui/SetupHeader';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { color, gutter, radius, space } from '@/ui/tokens';

const PROBLEMS = {
  empty: 'Type a name first.',
  taken: 'Someone already has that name. Add an initial?',
  full: `That's the most a table can take: ${MAX_PLAYERS}.`,
} as const;

/**
 * Who's playing, in the order you're sitting. Clues go round in this order,
 * starting from a random seat each round. Saved, so next time it's one tap.
 */
export default function PlayersScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const players = useTableStore((s) => s.players);
  const add = useTableStore((s) => s.add);
  const rename = useTableStore((s) => s.rename);
  const remove = useTableStore((s) => s.remove);
  const move = useTableStore((s) => s.move);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const input = useRef<TextInput>(null);

  const submit = () => {
    const issue = nameProblem(draft, players);
    // The keyboard's done key on an empty field means "that's everyone".
    if (issue === 'empty') {
      Keyboard.dismiss();
      return;
    }
    if (issue) {
      setProblem(PROBLEMS[issue]);
      return;
    }
    add(draft);
    haptics.select();
    setDraft('');
    setProblem(null);
    input.current?.focus();
  };

  const saveRename = (id: string) => {
    const issue = nameProblem(editDraft, players, id);
    if (!issue) rename(id, editDraft);
    setEditing(null);
  };

  const confirmRemove = (id: string, name: string) =>
    Alert.alert(`Remove ${name}?`, 'They can always join again.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(id) },
    ]);

  // A name still in the box counts: typing the last name and tapping Done adds it.
  const pending = draft.trim() && !nameProblem(draft, players) ? 1 : 0;
  const short = MIN_PLAYERS - players.length - pending;

  const finish = () => {
    if (pending) add(draft);
    Keyboard.dismiss();
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SetupHeader
          title="Who's playing?"
          subtitle={`${MIN_PLAYERS} to ${MAX_PLAYERS}. Add them in the order you're sitting.`}
          onClose={router.back}
          mood="peek"
          trailing={short > 0 ? null : <Button label="Done" icon="check" size="sm" variant="white" onPress={finish} />}
        />

        <View style={styles.addRow}>
          <Field
            ref={input}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setProblem(null);
            }}
            placeholder={players.length ? 'Next name' : 'First name'}
            maxLength={MAX_NAME_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={submit}
            style={styles.input}
            accessibilityLabel="Player name"
          />
          <CircleButton icon="plus" label="Add player" tone="brand" size={50} onPress={submit} />
        </View>
        {problem ? (
          <Text variant="caption" tone="muted" style={styles.problem}>
            {problem}
          </Text>
        ) : null}

        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {players.map((player, index) => (
            <PopIn key={player.id} from="rise">
              <View style={styles.row}>
                <Text variant="caption" tone="faint" style={styles.seat}>
                  {index + 1}
                </Text>
                <Avatar player={player} size={40} />
                {editing === player.id ? (
                  <Field
                    value={editDraft}
                    onChangeText={setEditDraft}
                    autoFocus
                    maxLength={MAX_NAME_LENGTH}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onSubmitEditing={() => saveRename(player.id)}
                    onBlur={() => saveRename(player.id)}
                    style={styles.rename}
                    accessibilityLabel={`Rename ${player.name}`}
                  />
                ) : (
                  <Tap
                    onPress={() => {
                      setEditing(player.id);
                      setEditDraft(player.name);
                    }}
                    haptic={false}
                    squish={0.98}
                    accessibilityLabel={`${player.name}. Tap to rename.`}
                    style={styles.nameTap}
                  >
                    <Text variant="heading" numberOfLines={1}>
                      {player.name}
                    </Text>
                  </Tap>
                )}
                <View style={styles.tools}>
                  <Tap
                    onPress={() => move(player.id, -1)}
                    disabled={index === 0}
                    accessibilityLabel={`Move ${player.name} up`}
                    contentStyle={[styles.tool, index === 0 && styles.toolOff]}
                  >
                    <Icon name="up" size={18} color={color.text} />
                  </Tap>
                  <Tap
                    onPress={() => move(player.id, 1)}
                    disabled={index === players.length - 1}
                    accessibilityLabel={`Move ${player.name} down`}
                    contentStyle={[styles.tool, index === players.length - 1 && styles.toolOff]}
                  >
                    <Icon name="down" size={18} color={color.text} />
                  </Tap>
                  <Tap
                    onPress={() => confirmRemove(player.id, player.name)}
                    accessibilityLabel={`Remove ${player.name}`}
                    contentStyle={styles.tool}
                  >
                    <Icon name="close" size={16} color={color.textMuted} />
                  </Tap>
                </View>
              </View>
            </PopIn>
          ))}
          {players.length === 0 ? (
            <Text variant="body" tone="muted" align="center" style={styles.empty}>
              Everyone at the table, including you.
            </Text>
          ) : null}
        </ScrollView>

        <Footer>
          <Button
            label={short > 0 ? `Add ${short} more` : 'Done'}
            variant="primary"
            size="lg"
            disabled={short > 0}
            onPress={finish}
          />
        </Footer>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: gutter },
  input: { flex: 1 },
  problem: { paddingHorizontal: gutter, paddingTop: space.sm },
  list: { paddingHorizontal: gutter, paddingTop: space.md, paddingBottom: space.lg, gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  seat: { width: 16, textAlign: 'center' },
  nameTap: { flex: 1, minHeight: 40, justifyContent: 'center' },
  rename: { flex: 1, paddingVertical: 6 },
  tools: { flexDirection: 'row', gap: 4 },
  tool: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: color.glass },
  toolOff: { opacity: 0.3 },
  empty: { paddingTop: space.lg },
});

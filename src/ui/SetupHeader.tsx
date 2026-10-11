import { StyleSheet, View } from 'react-native';
import { useLayout } from './layout';
import { Mascot, type MascotMood } from './Mascot';
import { Text } from './Text';
import { TopBar } from './TopBar';
import { gutter, space } from './tokens';

export type SetupHeaderProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  mood?: MascotMood;
};

/**
 * The header for a setup screen: a close button, the question in big type,
 * and Shade stuck beside it.
 */
export function SetupHeader({ title, subtitle, onClose, mood = 'smirk' }: SetupHeaderProps) {
  const { short } = useLayout();

  if (short) {
    return <TopBar leading="close" onLeading={onClose} title={title} trailing={<Mascot size={40} mood={mood} animated={false} />} />;
  }

  return (
    <View>
      <TopBar leading="close" onLeading={onClose} />
      <View style={styles.ask}>
        <View style={styles.copy}>
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.sticker}>
          <Mascot size={72} mood={mood} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ask: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: gutter, paddingBottom: space.md },
  copy: { flex: 1, gap: 4 },
  sticker: { transform: [{ rotate: '8deg' }] },
});

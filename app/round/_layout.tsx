import { Stack } from 'expo-router';
import { color } from '@/ui/tokens';

/**
 * Round screens. Gestures are off throughout: a swipe back mid-round would
 * undo a secret or a vote, and the way out is the close button, which asks.
 */
export default function RoundLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
        contentStyle: { backgroundColor: color.background },
      }}
    />
  );
}

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Leaving a round. The game is saved at every step, so leaving is never a
 * loss: Play shows a banner to pick up exactly where the table was.
 */
export function useLeave(): () => void {
  const router = useRouter();
  return useCallback(() => {
    Alert.alert('Leave the round?', 'The game is saved. Resume it from Play whenever you like.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        onPress: () => {
          router.dismissAll();
          router.replace('/');
        },
      },
    ]);
  }, [router]);
}

/** Straight home, no questions: for when there's no game to be in. */
export function useGoHome(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [router]);
}

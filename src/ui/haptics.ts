import * as Haptics from 'expo-haptics';

/**
 * Haptic vocabulary.
 *
 * One rule matters more than any pattern: the reveal haptic is identical for
 * someone who is in and for the imposter. A buzz that differed by role would
 * tell the player beside you which card you just saw.
 *
 * Every call is fire-and-forget: a failed haptic must never interrupt a round,
 * and haptics are a no-op in Low Power Mode and on devices without a Taptic
 * Engine.
 */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fire(run: () => Promise<void>): void {
  void run().catch(() => undefined);
}

export type HapticsSettings = { enabled: boolean };

export function createHaptics(settings: HapticsSettings) {
  const guard = (run: () => Promise<void>) => {
    if (settings.enabled) fire(run);
  };

  return {
    /** The hold completed and a role is showing. The same for every role. */
    reveal(): void {
      guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    },

    /** A beat of a countdown, or the next speaker. */
    tick(): void {
      guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    },

    /** Three light ticks as the talk timer runs low. */
    warning(): void {
      guard(async () => {
        for (let i = 0; i < 3; i += 1) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await wait(140);
        }
      });
    },

    /** The table caught the imposter: two crisp pulses and a success. */
    caught(): void {
      guard(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        await wait(90);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    },

    /** The imposter won: a heavy rumble. */
    escaped(): void {
      guard(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        for (let i = 0; i < 2; i += 1) {
          await wait(120);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      });
    },

    /** Something landed: a vote locked, a suspect revealed. */
    thud(): void {
      guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    },

    /** Menu-level acknowledgement. */
    select(): void {
      guard(() => Haptics.selectionAsync());
    },
  };
}

export type AppHaptics = ReturnType<typeof createHaptics>;

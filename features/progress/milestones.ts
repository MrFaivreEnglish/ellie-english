import AsyncStorage from '@react-native-async-storage/async-storage';

// Word milestones run 25, 50, 100, 250, then repeat the x2, x2, x2.5 steps: 500, 1000, 2500, 5000...
export const MILESTONE_DISMISSED_KEY = '@milestone_dismissed_v1';

export const getMilestones = (upTo: number): number[] => {
  const list = [25, 50, 100, 250];
  // Always enough entries past `upTo` to fill the four-circle track.
  while (list.filter((value) => value > upTo).length < 3) {
    const last = list[list.length - 1];
    list.push(last * [2, 2, 2.5][(list.length - 1) % 3]);
  }
  return list;
};

export type MilestoneProgress = {
  // Highest milestone already reached (0 if none).
  reached: number;
  next: number;
  // 0-1 of the way from `reached` to `next`.
  fraction: number;
  // Four milestones to draw, always including `next`.
  track: number[];
};

export const getMilestoneProgress = (learnt: number): MilestoneProgress => {
  const milestones = getMilestones(learnt);
  const nextIndex = milestones.findIndex((value) => value > learnt);
  const next = milestones[nextIndex];
  const reached = nextIndex > 0 ? milestones[nextIndex - 1] : 0;
  const start = Math.max(0, nextIndex - 2);

  return {
    reached,
    next,
    fraction: Math.min(1, Math.max(0, (learnt - reached) / (next - reached))),
    track: milestones.slice(start, start + 4),
  };
};

export const getDismissedMilestone = async (): Promise<number> => {
  try {
    const value = parseInt((await AsyncStorage.getItem(MILESTONE_DISMISSED_KEY)) ?? '', 10);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

export const dismissMilestone = async (milestone: number) => {
  try {
    await AsyncStorage.setItem(MILESTONE_DISMISSED_KEY, String(milestone));
  } catch {}
};

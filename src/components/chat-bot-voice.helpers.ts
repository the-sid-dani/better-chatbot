const VOICE_TOOL_EXECUTING_STATES = new Set(["call"]);

export const VOICE_TOOL_AUTO_DISMISS_MS = 15_000;
export const VOICE_TOOL_DISMISSED_MAX = 50;

export const isVoiceToolExecutingState = (state: string) => {
  return VOICE_TOOL_EXECUTING_STATES.has(state) || state.startsWith("input");
};

export const addCompletedToolIdsToDismissed = (
  dismissed: Set<string>,
  completedIds: string[],
  latestCompletedId: string | undefined,
  maxSize: number,
) => {
  const next = new Set(dismissed);
  completedIds.forEach((id) => {
    if (!id) return;
    if (latestCompletedId && id === latestCompletedId) return;
    next.add(id);
  });

  if (maxSize > 0) {
    while (next.size > maxSize) {
      const iterator = next.values().next();
      if (iterator.done) break;
      next.delete(iterator.value);
    }
  }

  return next;
};

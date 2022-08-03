export function createInitialSessionData() {
  return {
    sets: new Set(),
  };
}

export type SessionData = ReturnType<typeof createInitialSessionData>;

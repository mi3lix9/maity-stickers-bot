export interface SessionData {
  sets: Set<string>;
}

export function createInitialSessionData(): SessionData {
  return {
    sets: new Set(),
  };
}

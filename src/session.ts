export interface SessionData {
  sets: Map<string, { name: string; type: "PNG" | "ANIMATED" | "VIDEO" }>;
}

export function createInitialSessionData(): SessionData {
  return {
    sets: new Map(),
  };
}

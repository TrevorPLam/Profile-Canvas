export interface Topic {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const TOPICS: Topic[] = [
  { id: 'music', label: 'Music', icon: 'music', color: '#7B6BC9' },
  { id: 'travel', label: 'Travel', icon: 'map-pin', color: '#F2917A' },
  { id: 'cooking', label: 'Cooking', icon: 'coffee', color: '#4C7A6B' },
  { id: 'gaming', label: 'Gaming', icon: 'zap', color: '#B0455F' },
  { id: 'photography', label: 'Photography', icon: 'camera', color: '#3B5B7A' },
  { id: 'writing', label: 'Writing', icon: 'feather', color: '#8E4A8C' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'sun', color: '#D9603B' },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

const KEYWORDS: Record<string, string[]> = {
  music: ['music', 'song', 'synth', 'sound', 'chord', 'band', 'album', 'playlist'],
  travel: ['travel', 'trip', 'flight', 'passport', 'backpack', 'itinerary', 'abroad'],
  cooking: ['cook', 'recipe', 'kitchen', 'skillet', 'baking', 'dinner', 'food'],
  gaming: ['game', 'gaming', 'ranked', 'stream', 'controller', 'clutch'],
  photography: ['photo', 'camera', 'lens', 'portrait', 'shoot', 'film scanner'],
  writing: ['poem', 'poetry', 'writing', 'wrote', 'novel', 'draft'],
  lifestyle: [],
};

/** Lightweight keyword match to auto-tag freshly composed posts with topics. */
export function inferTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const matches = TOPICS.filter((topic) =>
    (KEYWORDS[topic.id] ?? []).some((kw) => lower.includes(kw)),
  ).map((t) => t.id);
  return matches.length > 0 ? matches : ['lifestyle'];
}

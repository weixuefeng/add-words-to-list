export type WordStatus = 'new' | 'known';

export interface WordSense {
  pos: string;
  defZh: string;
}

export interface Word {
  id: string;
  term: string;
  key: string;
  phonetic?: string;
  senses?: WordSense[];
  example?: string;
  hits: number;
  status: WordStatus;
  createdAt: number;
  lastSeenAt: number;
  knownAt?: number;
}

export type WordMap = Record<string, Word>;

export interface Settings {
  llmApiKey: string;
  llmModel: string;
}

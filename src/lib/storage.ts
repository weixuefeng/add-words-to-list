import { DEFAULT_LLM_MODEL } from './constants';
import { wordKey } from './normalize';
import type { Settings, Word, WordMap, WordStatus } from './types';

const WORDS_KEY = 'words';
const SETTINGS_KEY = 'settings';

const DEFAULT_SETTINGS: Settings = {
  llmApiKey: '',
  llmModel: DEFAULT_LLM_MODEL,
};

/** 串行化写操作，避免两次快速添加互相覆盖。 */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => undefined);
  return next;
}

export async function getWords(): Promise<WordMap> {
  const stored = await chrome.storage.local.get(WORDS_KEY);
  return (stored[WORDS_KEY] as WordMap | undefined) ?? {};
}

export function addWord(
  term: string,
  now = Date.now(),
): Promise<{ word: Word; duplicated: boolean }> {
  return serialize(async () => {
    const key = wordKey(term);
    const words = await getWords();
    const existing = words[key];

    if (existing) {
      const word: Word = { ...existing, hits: existing.hits + 1, lastSeenAt: now };
      words[key] = word;
      await chrome.storage.local.set({ [WORDS_KEY]: words });
      return { word, duplicated: true };
    }

    const word: Word = {
      id: crypto.randomUUID(),
      term,
      key,
      hits: 1,
      status: 'new',
      createdAt: now,
      lastSeenAt: now,
    };
    words[key] = word;
    await chrome.storage.local.set({ [WORDS_KEY]: words });
    return { word, duplicated: false };
  });
}

export function updateWord(key: string, patch: Partial<Word>): Promise<Word | undefined> {
  return serialize(async () => {
    const words = await getWords();
    const existing = words[key];
    if (!existing) return undefined;

    const word: Word = { ...existing, ...patch };
    words[key] = word;
    await chrome.storage.local.set({ [WORDS_KEY]: words });
    return word;
  });
}

export function setStatus(
  key: string,
  status: WordStatus,
  now = Date.now(),
): Promise<Word | undefined> {
  return serialize(async () => {
    const words = await getWords();
    const existing = words[key];
    if (!existing) return undefined;

    const word: Word = { ...existing, status, knownAt: status === 'known' ? now : undefined };
    words[key] = word;
    await chrome.storage.local.set({ [WORDS_KEY]: words });
    return word;
  });
}

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const saved = stored[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  return serialize(async () => {
    const next = { ...(await getSettings()), ...patch };
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  });
}

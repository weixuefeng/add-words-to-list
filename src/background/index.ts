import { normalizeSelection } from '../lib/normalize';
import { LlmError, fetchWordInfo } from '../lib/llm';
import { addWord, getSettings, getWords, updateWord } from '../lib/storage';
import type { RuntimeMessage } from '../lib/types';

const MENU_ID = 'add-word-to-list';
const BADGE_COLOR = '#2563eb';
const BADGE_DURATION_MS = 1500;

/** 同一时刻只解析一次同一个词，避免连点两次发两个请求。 */
const inFlight = new Set<string>();

async function registerMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Add to word list',
    contexts: ['selection'],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  void registerMenus();
});

chrome.runtime.onStartup.addListener(() => {
  void registerMenus();
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  void handleAdd(info.selectionText ?? '');
});

chrome.action.onClicked.addListener(() => {
  void openApp();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === 'parse-word') {
    void parseWord(message.key, message.term).finally(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'parse-pending') {
    void parsePending().finally(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

async function handleAdd(rawSelection: string): Promise<void> {
  const term = normalizeSelection(rawSelection);
  if (!term) {
    await flashBadge('!');
    return;
  }

  const { word, duplicated } = await addWord(term);
  await flashBadge(duplicated ? '✓' : '+');

  if (word.parseState !== 'done') {
    void parseWord(word.key, word.term);
  }
}

async function parseWord(key: string, term: string): Promise<void> {
  if (inFlight.has(key)) return;
  inFlight.add(key);

  try {
    const settings = await getSettings();
    if (!settings.llmApiKey.trim()) {
      await updateWord(key, { parseState: 'failed', parseError: 'no-key' });
      return;
    }

    await updateWord(key, { parseState: 'pending', parseError: undefined });
    const info = await fetchWordInfo(term, settings);
    await updateWord(key, { ...info, parseState: 'done', parseError: undefined });
  } catch (error) {
    const code = error instanceof LlmError ? error.code : 'bad-response';
    await updateWord(key, { parseState: 'failed', parseError: code });
  } finally {
    inFlight.delete(key);
  }
}

/** 串行补解析：设置里填完 Key 后、或者之前解析失败的词，一次点完。 */
async function parsePending(): Promise<void> {
  const words = await getWords();
  const targets = Object.values(words).filter((word) => word.parseState !== 'done');
  for (const word of targets) {
    await parseWord(word.key, word.term);
  }
}

async function flashBadge(text: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => {
    void chrome.action.setBadgeText({ text: '' });
  }, BADGE_DURATION_MS);
}

type ExtensionTabContext = { tabId: number; windowId: number };

const runtimeApi = chrome.runtime as unknown as {
  getContexts?: (filter: { contextTypes: string[] }) => Promise<ExtensionTabContext[]>;
};

/** 点图标：已有词表标签页就切过去，没有才新开，避免开一堆重复页面。 */
async function openApp(): Promise<void> {
  const url = chrome.runtime.getURL('index.html');

  try {
    const contexts = (await runtimeApi.getContexts?.({ contextTypes: ['TAB'] })) ?? [];
    const existing = contexts.find((item) => item.tabId >= 0);
    if (existing) {
      await chrome.tabs.update(existing.tabId, { active: true });
      await chrome.windows.update(existing.windowId, { focused: true });
      return;
    }
  } catch {
    // getContexts 不可用时直接新开标签页
  }

  await chrome.tabs.create({ url });
}

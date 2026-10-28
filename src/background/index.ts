import { normalizeSelection } from '../lib/normalize';
import { addWord } from '../lib/storage';

const MENU_ID = 'add-word-to-list';
const BADGE_COLOR = '#2563eb';
const BADGE_DURATION_MS = 1500;

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

async function handleAdd(rawSelection: string): Promise<void> {
  const term = normalizeSelection(rawSelection);
  if (!term) {
    await flashBadge('!');
    return;
  }
  const { duplicated } = await addWord(term);
  await flashBadge(duplicated ? '✓' : '+');
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

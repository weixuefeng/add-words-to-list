import type { Word } from './types';

const PARSE_ERROR_TEXT: Record<string, string> = {
  'no-key': '还没填 API Key',
  auth: 'API Key 无效',
  network: '网络请求失败',
  'bad-response': '接口返回异常',
};

export function parseErrorText(code?: string): string {
  return (code ? PARSE_ERROR_TEXT[code] : undefined) ?? '解析失败';
}

/** 列表里每个词右侧那一行说明。 */
export function wordSummary(word: Word): string {
  const first = word.senses?.[0]?.defZh;
  if (first) return first;

  if (word.parseState === 'pending') return '解析中…';
  if (word.parseState === 'failed') return `解析失败：${parseErrorText(word.parseError)}`;
  return '尚未解析';
}

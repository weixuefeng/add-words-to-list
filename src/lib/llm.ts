import type { Settings, Word, WordSense } from './types';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 20_000;
const MAX_SENSES = 6;

export type WordInfo = Pick<Word, 'phonetic' | 'senses' | 'example'>;

export type LlmErrorCode = 'no-key' | 'auth' | 'network' | 'bad-response';

export class LlmError extends Error {
  readonly code: LlmErrorCode;

  constructor(code: LlmErrorCode, message: string) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
  }
}

const SYSTEM_PROMPT = '你是英汉词典编辑，只输出 JSON，不输出解释、代码块或多余文字。';

function buildUserPrompt(term: string): string {
  return [
    `单词：${term}`,
    '请输出 json，字段如下：',
    '{"phonetic":"国际音标，如 /ˈhændl/","senses":[{"pos":"词性缩写，如 v. / n. / adj.","defZh":"简体中文释义"}],"example":"一个简短的英文例句"}',
    `要求：senses 给 1-${MAX_SENSES} 个常用义项，按常用度排序；defZh 不写例句；example 控制在 20 个词以内。`,
  ].join('\n');
}

export async function fetchWordInfo(term: string, settings: Settings): Promise<WordInfo> {
  const apiKey = settings.llmApiKey.trim();
  if (!apiKey) throw new LlmError('no-key', '没有配置 API Key');

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.llmModel || 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(term) },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new LlmError('network', '请求失败');
  }

  if (response.status === 401 || response.status === 403) {
    throw new LlmError('auth', 'API Key 无效');
  }
  if (!response.ok) {
    throw new LlmError('bad-response', `接口返回 ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new LlmError('bad-response', '接口没有返回内容');

  return normalizeResult(content);
}

function normalizeResult(content: string): WordInfo {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) throw new LlmError('bad-response', '返回内容不是 JSON');

  let parsed: unknown;
  try {
    parsed = JSON.parse(content.slice(start, end + 1));
  } catch {
    throw new LlmError('bad-response', '返回内容不是 JSON');
  }

  const record = parsed as { phonetic?: unknown; senses?: unknown; example?: unknown };
  const senses: WordSense[] = Array.isArray(record.senses)
    ? record.senses
        .map((item) => {
          const sense = item as { pos?: unknown; defZh?: unknown };
          return { pos: asText(sense.pos), defZh: asText(sense.defZh) };
        })
        .filter((sense) => sense.defZh.length > 0)
        .slice(0, MAX_SENSES)
    : [];

  if (senses.length === 0) throw new LlmError('bad-response', '没有解析出释义');

  return {
    phonetic: asText(record.phonetic) || undefined,
    senses,
    example: asText(record.example) || undefined,
  };
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

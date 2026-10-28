const EDGE_PUNCT = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * 把右键选中的文本整理成入库的单词。
 * 只接受单个单词：去掉首尾标点和多余空白，含空格的一律拒收。
 */
export function normalizeSelection(raw: string): string | null {
  const cleaned = raw.replace(EDGE_PUNCT, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  if (cleaned.includes(' ')) return null;
  return cleaned;
}

/** 去重键，同时也是 storage 的索引和详情页路由参数。 */
export function wordKey(term: string): string {
  return term.toLowerCase();
}

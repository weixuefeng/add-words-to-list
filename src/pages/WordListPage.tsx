import { useEffect, useMemo, useState } from 'react';
import { getWords } from '../lib/storage';
import type { Word } from '../lib/types';

type Filter = 'all' | 'new' | 'known';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'new', label: '未掌握' },
  { id: 'known', label: '已掌握' },
];

export function WordListPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const map = await getWords();
      if (cancelled) return;
      setWords(Object.values(map));
      setLoading(false);
    };

    void load();
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && 'words' in changes) void load();
    };
    chrome.storage.onChanged.addListener(onChanged);

    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return words
      .filter((word) => (filter === 'all' ? true : word.status === filter))
      .filter((word) => (query ? word.term.toLowerCase().includes(query) : true))
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  }, [words, filter, keyword]);

  const knownCount = words.filter((word) => word.status === 'known').length;

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>生词列表</h1>
          <p className="muted">
            未掌握 {words.length - knownCount} · 已掌握 {knownCount}
          </p>
        </div>
        <a className="link" href="#/settings">
          设置
        </a>
      </header>

      <input
        className="search"
        type="search"
        placeholder="搜索单词"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />

      <nav className="tabs">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === filter ? 'tab active' : 'tab'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading ? <p className="empty">加载中…</p> : null}
      {!loading && visible.length === 0 ? <EmptyState filter={filter} /> : null}

      <ul className="list">
        {visible.map((word) => (
          <li key={word.key}>
            <a className="row" href={`#/word/${encodeURIComponent(word.key)}`}>
              <span className="term">{word.term}</span>
              <span className="def">{word.senses?.[0]?.defZh ?? '尚未解析'}</span>
              {word.hits > 1 ? <span className="hits">×{word.hits}</span> : null}
              {word.status === 'known' ? <span className="badge">已掌握</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  if (filter === 'known') {
    return <p className="empty">还没有标记为已掌握的词。</p>;
  }
  return (
    <p className="empty">
      还没有词。在网页里选中一个单词，右键 →「Add to word list」。
    </p>
  );
}

import { useEffect, useState } from 'react';
import { getWords, setStatus } from '../lib/storage';
import type { Word } from '../lib/types';

export function WordDetailPage({ wordKey }: { wordKey: string }) {
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const map = await getWords();
      if (cancelled) return;
      setWord(map[wordKey] ?? null);
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
  }, [wordKey]);

  if (loading) {
    return (
      <div className="page">
        <p className="empty">加载中…</p>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="page">
        <p className="empty">找不到这个单词。</p>
        <a className="link" href="#/">
          返回列表
        </a>
      </div>
    );
  }

  const toggleStatus = async () => {
    setPending(true);
    await setStatus(word.key, word.status === 'known' ? 'new' : 'known');
    setPending(false);
  };

  return (
    <div className="page">
      <header className="header">
        <a className="link" href="#/">
          ← 返回列表
        </a>
        <a className="link" href="#/settings">
          设置
        </a>
      </header>

      <section className="detail">
        <h1 className="detail-term">{word.term}</h1>
        {word.phonetic ? <p className="phonetic">{word.phonetic}</p> : null}

        {word.senses?.length ? (
          <ul className="senses">
            {word.senses.map((sense) => (
              <li key={`${sense.pos}-${sense.defZh}`}>
                {sense.pos ? <span className="pos">{sense.pos}</span> : null}
                {sense.defZh}
              </li>
            ))}
          </ul>
        ) : (
          <p className="notice">
            释义还没解析。下一步接入大模型后，这里会显示音标、词性和中文释义。
          </p>
        )}

        {word.example ? <p className="example">{word.example}</p> : null}

        <dl className="meta">
          <div>
            <dt>添加次数</dt>
            <dd>{word.hits}</dd>
          </div>
          <div>
            <dt>首次添加</dt>
            <dd>{formatDate(word.createdAt)}</dd>
          </div>
          <div>
            <dt>最近添加</dt>
            <dd>{formatDate(word.lastSeenAt)}</dd>
          </div>
        </dl>

        <button className="primary" type="button" onClick={() => void toggleStatus()} disabled={pending}>
          {word.status === 'known' ? '移回生词' : '我记住了'}
        </button>
      </section>
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

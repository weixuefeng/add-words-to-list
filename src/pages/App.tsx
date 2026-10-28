import { useEffect, useState } from 'react';
import { SettingsPage } from './SettingsPage';
import { WordDetailPage } from './WordDetailPage';
import { WordListPage } from './WordListPage';

const DETAIL_PREFIX = '#/word/';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

export default function App() {
  const hash = useHash();

  if (hash.startsWith(DETAIL_PREFIX)) {
    return <WordDetailPage wordKey={decodeURIComponent(hash.slice(DETAIL_PREFIX.length))} />;
  }

  if (hash === '#/settings') {
    return <SettingsPage />;
  }

  return <WordListPage />;
}

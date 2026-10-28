import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../lib/storage';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-chat');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getSettings().then((settings) => {
      setApiKey(settings.llmApiKey);
      setModel(settings.llmModel);
    });
  }, []);

  const onSave = async () => {
    await saveSettings({
      llmApiKey: apiKey.trim(),
      llmModel: model.trim() || 'deepseek-chat',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <header className="header">
        <a className="link" href="#/">
          ← 返回列表
        </a>
      </header>

      <section className="detail">
        <h1>设置</h1>

        <label className="field">
          <span>大模型 API Key</span>
          <input
            type="password"
            placeholder="sk-..."
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>

        <label className="field">
          <span>模型</span>
          <input value={model} onChange={(event) => setModel(event.target.value)} />
        </label>

        <p className="notice">
          Key 只保存在这台电脑的插件本地存储里，不会同步到云端，也不会写进代码。
        </p>

        <div className="actions">
          <button className="primary" type="button" onClick={() => void onSave()}>
            保存
          </button>
          {saved ? <span className="muted">已保存</span> : null}
        </div>
      </section>
    </div>
  );
}

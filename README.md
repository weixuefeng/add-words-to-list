# Add Words to List

Chrome 插件。网页里选中单词 → 右键「Add to word list」→ 点插件图标打开词表 → 点词看详情 → 点「我记住了」移入已掌握。

## 开发

```bash
pnpm install
pnpm check      # typecheck + build
pnpm dev        # 持续构建，改完在 chrome://extensions 点刷新
```

## 加载到 Chrome

1. 打开 `chrome://extensions` .
2. 打开右上角「开发者模式」.
3. 点「加载已解压的扩展程序」，选本项目的 `dist/` 目录 .
4. 选中页面上任意一个英文单词，右键「Add to word list」，图标上会闪一下 `+` .

## 现状

右键添加、去重计数、LLM 自动解析释义、批量补解析、列表搜索筛选、详情、已掌握切换已可用。

第一次使用：打开插件页 →「设置」→ 填 DeepSeek API Key 并保存，之后新加的词会自动解析，之前加的词会自动补上。开发规范和目录约定见 [CLAUDE.md](./CLAUDE.md) .

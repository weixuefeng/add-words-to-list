# Add Words to List

浏览网页时选中生词，右键收进自己的词表；自动补音标、词性、中文释义和例句；学会的点「我记住了」，主列表就只剩还没搞定的。

一个 Chrome MV3 扩展，数据只存本地，不上传、不需要注册。

## 为什么做这个

读英文网页遇到生词，用翻译工具查完就关掉了，下次遇到还得再查一遍。现成的划词翻译插件强在「当场看懂」，生词本通常只是为导出到 Anki / 欧路准备的附属功能，得再搭一套复习流程。

这个扩展把范围压到三件事：

- **收藏** —— 选中 → 右键 → 存下，不弹窗、不等网络
- **解释** —— 自动补音标、词性、中文释义、例句
- **清点** —— 记住的词移入「已掌握」，主列表里只剩没掌握的

不做划词翻译气泡，不做复习算法，不做账号和云同步。

## 功能

- 右键添加单词，图标角标闪 `+`；重复添加同一个词只累计次数，不新建条目
- 添加后自动解析释义，页面关掉也继续跑；失败会写明原因（key 无效 / 网络异常 / 接口异常）并可重试
- 词表支持搜索、未掌握 / 已掌握筛选、按最近添加排序
- 详情页显示音标、多个义项、例句、添加次数和时间
- 「我记住了」移入已掌握，随时可以移回
- 一键补解析：设置里填完 key，之前没解析的词自动补齐

## 安装

还没上架商店，从源码构建：

```bash
git clone https://github.com/<your-github>/add-words-to-list.git
cd add-words-to-list
pnpm install
pnpm build
```

然后在 Chrome 里：

1. 打开 `chrome://extensions`
2. 右上角打开「开发者模式」
3. 点「加载已解压的扩展程序」，选择项目下的 `dist/` 目录
4. 打开任意英文网页，选中一个单词，右键「Add to word list」

需要 Chrome 116 及以上（用到了 `chrome.runtime.getContexts`）。

## 配置

1. 点工具栏里的扩展图标，打开词表
2. 右上角「设置」
3. 填入 DeepSeek API Key，保存

Key 可以去 [platform.deepseek.com](https://platform.deepseek.com) 申请。它只保存在本机插件的 `chrome.storage.local` 里，不会同步到云端，也不会写进代码。

默认模型 `deepseek-flash`，可在设置页修改。请求时显式关闭了思考模式——查词典不需要推理，开着会让每个词多等 2–5 秒，输出 token 还会翻几倍。

**成本**：一个词约 180 输入 token + 130 输出 token，按官方价约 0.001 元，1000 个词不到 1 元；谷时价格减半。解析结果会写回本地，同一个词只请求一次。

## 隐私

- 词表、释义、设置全部存在本机 `chrome.storage.local`
- 只有你添加的那个单词会发给 DeepSeek API，页面内容、URL、浏览记录都不会上传
- 申请的权限：`contextMenus`（右键菜单）、`storage`（本地存储）、`host_permissions: https://api.deepseek.com/*`（发送解析请求）

## 已知限制

- 只接受单个单词。选中的是短语、整句或多个词时会忽略，角标闪 `!`
- 不做词形归一：`run` / `running` / `runs` 是三条独立记录，会各请求一次
- 仅支持桌面版 Chromium 浏览器（Chrome / Edge 等）。手机浏览器不支持扩展
- 没有云同步；卸载扩展会连同数据一起清掉，换电脑需要手动搬（导出功能还没做）
- 存储上限约 10MB，按当前单条 380B 算约 2.7 万个词，够用很久

## 开发

```bash
pnpm install
pnpm dev        # 持续构建，改完在 chrome://extensions 点刷新
pnpm typecheck  # tsc --noEmit
pnpm build      # 构建到 dist/
pnpm check      # typecheck + build，提交前跑这个
```

技术栈：Vite + React + TypeScript，MV3，无 UI 库、无路由库（`location.hash` 手写）。不用 `@crxjs/vite-plugin`，Vite 多入口 + 手动维护 `public/manifest.json` 更可控。

目录约定、数据模型和开发规范见 [CLAUDE.md](./CLAUDE.md) 。

## Roadmap

- [ ] 导出 / 导入 JSON
- [ ] 词形归一（running → run）
- [ ] 扩展图标
- [ ] 手机端查看（需要后端同步，暂时没计划）

# cwzbb's blog — 水墨主题个人博客

一个基于 **Hexo + Butterfly** 搭建的个人博客，采用「水墨」风格设计：墨色山峦、淡墨远山、雪落无声。

🔗 在线地址：<https://cuiwenzhe1.github.io>

> 本仓库为 GitHub Pages 部署产物（由 `hexo d -g` 自动生成并推送），博客源码位于本地，包含自定义主题样式、JavaScript 特效与页面模板。

## ✨ 功能亮点

- **水墨风格设计** — 自定义 `custom.css` 覆盖 Butterfly 主题：墨色底纹背景、磨砂卡片、淡墨远山 SVG 页脚
- **下雪特效** — 纯 Canvas 实现的 `snow.js`（无依赖），右下角「❄ 雪花」按钮可开关，选择记忆在 `localStorage`
- **打字机首页** — 首页标题逐字打出，配合墨色山水英雄图（已压缩优化，2560×1071 / 576KB）
- **音乐播放器** — 基于 APlayer 的右下角播放器，支持拖拽、歌词显示
- **访问统计** — busuanzi 浏览 / 访客计数，并修复了 pjax 切换页面导致计数虚增的问题
- **giscus 评论系统** — 基于 GitHub Discussions，无需自建服务器
- **自定义页面** — 关于 / 友链 / 项目展示页，每个页面有独立横幅图（ink / girl / dragon）

## 🛠 技术栈

| 类别 | 技术 |
| --- | --- |
| 博客框架 | [Hexo](https://hexo.io/) 8.x |
| 主题 | [Butterfly](https://butterfly.js.org/) 5.7.0 |
| 部署 | GitHub Pages（hexo-deployer-git，SSH） |
| 特效 | 原生 JavaScript + Canvas（snow.js、typewriter.js） |
| 评论 | giscus（GitHub Discussions） |
| 统计 | busuanzi |

## 📁 目录结构

```text
my_blog/
├── _config.yml              # Hexo 主配置
├── _config.butterfly.yml    # Butterfly 主题配置（导航、注入、评论等）
├── source/
│   ├── _posts/              # 文章（Markdown）
│   ├── about/               # 关于页
│   ├── link/                # 友链页
│   ├── projects/            # 项目展示页
│   ├── css/custom.css       # 水墨风格全部自定义样式
│   ├── img/                 # 站点图片资源
│   └── js/                  # 自定义脚本
│       ├── snow.js          # 下雪特效
│       ├── typewriter.js    # 打字机效果
│       ├── busuanzi-fix.js  # 访问统计 pjax 修复
│       ├── aplayer-drag.js  # 播放器拖拽
│       └── siteinfo.js
└── themes/butterfly/        # Butterfly 主题源码
```

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 本地预览（默认 http://localhost:4000）
npx hexo server

# 生成静态文件
npx hexo generate

# 生成并部署到 GitHub Pages
npx hexo deploy -g
```

> 部署前需配置好 GitHub SSH 密钥（`~/.ssh`），`_config.yml` 中 deploy 配置为
> `git@github.com:cuiwenzhe1/cuiwenzhe1.github.io.git`（main 分支）。

## 🎨 自定义指南

- 所有外观定制集中在 `source/css/custom.css`，通过主题 inject 注入，更新主题不会丢失
- 新增文章：`npx hexo new "文章标题"` 后编辑 `source/_posts/`
- 新增项目卡片：复制 `source/projects/index.md` 中的注释模板
- 页面横幅图由 front-matter 的 `top_img:` 控制；若新增页面，需在 `custom.css` 中按
  `#body-wrap.type-xxx #page-header` 的优先级追加覆盖规则（主题默认规则带 `!important`）

## 📄 License

本项目仅供个人学习与展示。Hexo 与 Butterfly 主题遵循各自的开源许可。

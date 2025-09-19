# JCodeNest Docs

这是一个基于 [Next.js](https://nextjs.org) 和 [shadcn/ui](https://ui.shadcn.com/) 构建的静态博客项目，旨在提供清晰、现代化的技术文档展示平台。

## 项目介绍

JCodeNest Docs 是一个现代化的文档站点，具有以下特性：

- 🚀 基于 Next.js 15 构建，支持 App Router
- 🎨 使用 shadcn/ui 和 Tailwind CSS 构建美观的用户界面
- 📱 完全响应式设计，支持移动端和桌面端
- ⚡ 集成 Turbopack 提升开发体验
- 🔧 TypeScript 支持，提供类型安全
- 🎯 SEO 友好，支持服务端渲染

## 技术栈

- **框架**: Next.js 15
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **图标**: Lucide React
- **字体**: Geist Font

## 快速开始

### 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
# 或者
bun install
```

### 本地开发

启动开发服务器：

```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
# 或者
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

您可以通过修改 `app/page.tsx` 来编辑页面，文件保存后页面会自动更新。

## 打包部署

### 构建项目

```bash
npm run build
# 或者
yarn build
# 或者
pnpm build
# 或者
bun run build
```

### 本地预览构建结果

```bash
npm run start
# 或者
yarn start
# 或者
pnpm start
# 或者
bun start
```

### 部署到 Vercel

最简单的部署方式是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)：

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入您的仓库
3. Vercel 会自动检测这是一个 Next.js 项目并进行部署

### 其他部署平台

本项目也可以部署到其他支持 Node.js 的平台：

- **Netlify**: 支持自动构建和部署
- **Railway**: 简单的容器化部署
- **自托管**: 可以在任何支持 Node.js 的服务器上运行

## 项目结构

```
.
├── app/                  # Next.js App Router 目录
│   ├── dashboard/        # 仪表盘页面
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局组件
│   └── page.tsx          # 首页
├── components/           # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   └── *.tsx             # 自定义组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数
└── ...
```

## 开发指南

### 添加新页面

在 `app/` 目录下创建新的文件夹和 `page.tsx` 文件即可创建新页面。

### 添加新组件

使用 shadcn/ui CLI 添加新的 UI 组件：

```bash
npx shadcn-ui@latest add [component-name]
```

### 自定义样式

项目使用 Tailwind CSS，您可以在 `tailwind.config.js` 中自定义主题配置。

## 了解更多

要了解更多关于本项目使用的技术，请查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 学习 Next.js 的功能和 API
- [shadcn/ui 文档](https://ui.shadcn.com/) - 学习如何使用 shadcn/ui 组件
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - 学习 Tailwind CSS 样式系统
- [Learn Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

本项目采用 MIT 许可证。详情请查看 LICENSE 文件。

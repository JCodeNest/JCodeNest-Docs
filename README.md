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

## 自托管部署（Node + Nginx + PM2 推荐）

本项目当前包含 API 路由与动态能力（见 /api/*），建议以 Next.js 原生运行的方式在自有服务器部署，既保留功能又最省改造成本。

### 环境准备
- Node.js 18+（建议 LTS）
- NPM 或 PNPM
- Nginx（反向代理与静态缓存）
- 可选：PM2（守护进程）、Certbot（HTTPS）

### 构建（本地或服务器均可）
```bash
# 推荐在服务器上构建；或在本地构建后仅上传构建产物（见下文 standalone）
npm ci
npm run build
```

### 启动（二选一）
- 直接启动
```bash
NODE_ENV=production PORT=3000 npm start
```

- 使用 PM2 守护（推荐）
```bash
npm i -g pm2
NODE_ENV=production PORT=3000 pm2 start "npm start" --name jcodnest-docs
pm2 save
pm2 startup   # 按提示执行以设置开机自启
```

### 标准 Nginx 反向代理（可直接粘贴）
将以下配置放入你的站点 server 块（根据域名与路径调整）。若已使用 upstream，可抽出到 http 级别统一管理。

```nginx
# /etc/nginx/conf.d/jcodnest.conf 示例
upstream jcodnest_upstream {
    server 127.0.0.1:3000;  # Next.js 应用监听端口
    keepalive 64;
}

server {
    listen 80;
    server_name your.domain.com;

    # 如使用 HTTPS，建议将 80 重定向至 443（此处略）
    # return 301 https://$host$request_uri;

    # 基础代理到 Next.js
    location / {
        proxy_pass http://jcodnest_upstream;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket/热更新等升级头（通用写法，保持兼容）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js 静态构建产物，强缓存且 immutable
    location /_next/static/ {
        proxy_pass http://jcodnest_upstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 公共静态资源（/public）适度缓存
    location /static/ {
        proxy_pass http://jcodnest_upstream;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # 一般也可直接由 Next.js 处理 /public 下的资源，无需额外 location
    # 如需 HTTPS：结合 Certbot 申请并自动续期证书
}
```

提示
- 若你的静态资源路径不是 /static/，可删除该段或对应调整。Next 的 /public 会映射为站点根路径（例如 /favicon.ico）。
- 建议开启 gzip/brotli（全局或 server 级）以降低带宽。

### 可选优化：standalone 精简部署
通过 standalone 将运行时依赖打包至 .next/standalone，部署更轻量，适合本地构建后仅上传最小集产物。

1) next.config.js 增加：
```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // 可选：生成 sourcemap、开启严格模式等
  reactStrictMode: true,
}

module.exports = nextConfig
```

2) 构建：
```bash
npm ci
npm run build
```

3) 部署以下目录/文件到服务器（例如 /srv/jcodnest）：
- .next/standalone/      # 包含 server.js 与必要 node_modules
- .next/static/          # 静态资源
- public/                # 公开资源
- .env.production（可选）

4) 启动：
```bash
cd /srv/jcodnest/.next/standalone
NODE_ENV=production PORT=3000 node server.js
# 或 PM2：
pm2 start server.js --name jcodnest --node-args="--env-file=/srv/jcodnest/.env.production"
pm2 save
pm2 startup
```

5) Nginx 反向代理同上。

常见问题
- 端口冲突：如 3000 已被占用，修改 PORT 环境变量，并同步更新 Nginx upstream。
- Turbopack 与生产：build 使用 Next 官方构建即可（日志显示 Turbopack 编译通过）；生产建议使用 npm start（next start）。
- 环境变量：将生产所需变量写入 .env.production，注意不要提交到仓库。

> 如果未来要改成纯静态托管（如 COS、GitHub Pages），需移除 API 与动态能力，开启 `output: "export"` 并在构建后 `npx next export`，部署 out 目录。该模式不保留 /api/* 与动态渲染能力。

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

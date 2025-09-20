# JCodeNest Docs

现代化的技术文档与知识站点，基于 Next.js 15 与 React 19 构建，内置简洁 UI、Markdown 增强、代码高亮与常用组件，开箱即用。

- 技术栈：Next.js 15（App Router, Turbopack）、React 19、Tailwind CSS 4、Radix UI、TypeScript 5
- Markdown 能力：GFM、目录、数学公式（KaTeX）、Mermaid、代码高亮等
- 运行模式：开发（dev）、生产（start），推荐 PM2 守护 + Nginx 反代

站内详细文档（推荐阅读）：
- 快速上手：content/0-本站搭建/1-快速上手.md
- 上线部署：content/0-本站搭建/2-上线部署.md
- 组件说明：content/0-本站搭建/3-组件说明.md

## 快速开始

环境要求
- Node.js 18+（建议 LTS）
- Git
- npm（或 pnpm/yarn，示例以 npm 为准）

获取代码并启动
```bash
git clone https://github.com/JCodeNest/JCodeNest-Docs.git
cd JCodeNest-Docs

# 安装依赖（干净环境优先 ci）
npm ci
# 若遇到锁文件/镜像问题可改用 npm install

# 启动开发
npm run dev
# 访问 http://localhost:3000
```

常见问题
- 端口占用：设置 `PORT=3001 npm run dev` 或释放占用进程
- 依赖异常：`npm cache verify && rm -rf node_modules package-lock.json && npm ci`
- Node 版本：使用 nvm 切换到 Node 18+（LTS）

更多细节：content/0-本站搭建/1-快速上手.md

## 部署（Node + PM2 + Nginx 推荐）

构建与启动
```bash
# 构建
npm ci
npm run build

# PM2 守护（可自定义端口与名称）
npm i -g pm2
NODE_ENV=production PORT=3000 pm2 start "npm start" --name jcodenest-docs
pm2 save
pm2 startup
```

PM2 常用命令
```bash
pm2 list
pm2 logs jcodenest-docs
pm2 restart jcodenest-docs
pm2 delete jcodenest-docs
```

Nginx 反向代理（示例）
```nginx
# /etc/nginx/conf.d/jcodenest.conf
upstream jcodenest_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your.domain.com;

    # 如使用 HTTPS，建议将 80 重定向至 443
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://jcodenest_upstream;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static/ {
        proxy_pass http://jcodenest_upstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 如有自定义静态目录，可按需开启
    # location /static/ {
    #   proxy_pass http://jcodenest_upstream;
    #   expires 30d;
    #   add_header Cache-Control "public, max-age=2592000";
    # }
}
```

提示
- 若你的静态资源路径不是 /static/，可删除该段或对应调整。Next 的 /public 会映射为站点根路径（例如 /favicon.ico）。
- 建议开启 gzip/brotli（全局或 server 级）以降低带宽。

安全与防火墙
- 仅对外暴露 80/443，由 Nginx 代理至内部 3000
- 若需直连 3000，开放安全组/防火墙对应端口

生效与验证
```bash
nginx -t && systemctl reload nginx
# 访问 http://your.domain.com 或 https://your.domain.com
```

更多细节与优化建议：content/0-本站搭建/2-上线部署.md

## 组件与关键技术

项目使用的核心库、用途说明与官网链接合集，便于扩展与个性化定制（如 Tailwind 主题、Radix 无样式组件配合 CVA、Remark/Rehype 插件链、Mermaid/KaTeX、Recharts、Motion 动效、tsparticles 等）。

详细清单与扩展建议：content/0-本站搭建/3-组件说明.md

## 贡献

欢迎提交 Issue 与 PR 改进文档与功能。

## 许可证

MIT
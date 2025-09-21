export interface SiteConfig {
  // 站点名称
  name: string
  // 站点副标题
  subtitle: string
  // 站点 Logo
  logo: {
    src: string
  }
  // 首页展示信息
  home: {
    // 首页主标题（可用于 Hero 标题）
    heroTitle: string
    // 首页副描述（用于一句话介绍）
    heroDescription: string
  }
  // 面包屑配置
  breadcrumb: {
    // 顶部站点文案（如“JCodeNest 文档”）
    rootLabel: string
    // 顶部当前页文案（如“首页”）
    currentLabel: string
    // 根链接（如“/”或“#”）
    rootHref: string
  }
  // 站长信息
  user: {
    // 站长名称
    name: string
    // 站长邮箱
    email: string
    // 站长头像
    avatar: string
  }
  // 侧边栏外链导航（使用 Lucide 图标名称字符串）
  navSecondary: {
    title: string
    url: string
    icon: 'Github' | 'MessageSquare'
  }[]
  // SEO 配置（用于注入 Head，提升 SEO 友好性）
  seo: {
    // 页面默认标题
    title: string
    // 页面默认描述
    description: string
    // 关键词
    keywords: string[]
    // 站点作者
    authors: { name: string; url?: string }[]
    // 主题色
    themeColor?: string
    // 站点基础 URL（用于 OG、canonical）
    siteUrl?: string
    // Open Graph 配置
    openGraph?: {
      title?: string
      description?: string
      url?: string
      siteName?: string
      images?: { url: string; width?: number; height?: number; alt?: string }[]
      locale?: string
      type?: "website" | "article"
    }
    // Twitter 卡片配置
    twitter?: {
      card?: "summary" | "summary_large_image"
      site?: string
      creator?: string
    }
    // 图标配置（浏览器标签图标）
    icons?: {
      // 浏览器标签图标（可指向 /favicon.ico 或自定义路径）
      favicon: string
    }
  }
}

// 站点配置
export const siteConfig: SiteConfig = {
  // 站点名称 
  name: "JcodeNest Document",
  // 站点副标题
  subtitle: "A Backend Engineer",
  // 站点 Logo
  logo: {
    src: "/logo.svg",
  },
  // 首页展示信息
  home: {
    // 首页主标题（可用于 Hero 标题）
    heroTitle: "JCodeNest Docs",
    // 首页副描述（用于一句话介绍）
    heroDescription: "现代化的技术文档平台，助你构建完整的知识体系",
  },
  // 面包屑配置
  breadcrumb: {
    // 顶部站点文案（如“JCodeNest 文档”）
    rootLabel: "JCodeNest 文档",
    // 顶部当前页文案（如“首页”）
    currentLabel: "首页",
    // 根链接（如“/”或“#”）
    rootHref: "#",
  },
  // 站长信息
  user: {
    // 站长名称
    name: "沉默的老李",
    // 站长邮箱
    email: "jcodenest@gmail.com",
    // 站长头像
    avatar: "/avatars/avatar.png",
  },
  // 侧边栏外链导航（使用 Lucide 图标名称字符串）
  navSecondary: [
    { title: "Github", url: "https://github.com/JCodeNest/JCodeNest-Docs", icon: "Github" },
    { title: "反馈", url: "https://github.com/JCodeNest/JCodeNest-Docs/issues/new", icon: "MessageSquare" },
  ],
  // SEO 配置（用于注入 Head，提升 SEO 友好性）
  seo: {
    // 页面默认标题
    title: "JCodeNest 文档",
    // 页面默认描述
    description: "现代化的技术文档平台，助你构建完整的知识体系。",
    // 关键词
    keywords: ["JCodeNest", "技术文档", "Java", "后端", "编程", "知识库"],
    // 站点作者
    authors: [{ name: "沉默的老李", url: "https://github.com/JCodeNest" }],
    // 主题色
    themeColor: "#0ea5e9",
    // 站点基础 URL
    siteUrl: "https://docs.jcodenest.com",
    // Open Graph 配置
    openGraph: {
      title: "JCodeNest 文档",
      description: "现代化的技术文档平台，助你构建完整的知识体系。",
      url: "https://docs.jcodenest.com",
      siteName: "JCodeNest Docs",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "JCodeNest Docs" }],
      locale: "zh_CN",
      type: "website",
    },
    // Twitter 卡片配置
    twitter: {
      card: "summary_large_image",
      site: "@JCodeNest",
      creator: "@JCodeNest",
    },
    // 图标配置（浏览器标签图标）
    icons: {
      favicon: "/favicon.ico",
    },
  },
}

export default siteConfig
import { NextResponse } from 'next/server'
import { getContentTree } from '@/lib/content'

// 递归将 ContentItem 转为侧边栏 nav 结构（支持任意层级）
function mapToNav(item: { title: string; type: 'folder' | 'file'; path: string; children?: any[] }) {
  const node: any = {
    title: item.title,
    url: item.type === 'file' ? `/docs?path=${encodeURIComponent(item.path)}` : '#',
    icon: item.type === 'folder' ? 'FolderOpen' : 'FileText',
    isActive: false,
  }
  if (item.children && item.children.length) {
    node.items = item.children.map(child => mapToNav(child))
  }
  return node
}

export async function GET() {
  try {
    const contentTree = getContentTree()

    const navMain = contentTree.map(item => mapToNav(item))

    return NextResponse.json({ navMain })
  } catch (error) {
    console.error('Error loading content tree:', error)

    // 返回默认导航数据
    const defaultNavMain = [
      {
        title: "博客文档",
        url: "#",
        icon: 'BookOpen',
        isActive: true,
        items: [
          { title: "欢迎页面", url: "#" },
          { title: "快速开始", url: "#" }
        ]
      }
    ]

    return NextResponse.json({ navMain: defaultNavMain })
  }
}
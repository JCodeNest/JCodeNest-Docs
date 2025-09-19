import { NextResponse } from 'next/server'
import { getContentTree, convertToNavData } from '@/lib/content'

export async function GET() {
  try {
    const contentTree = getContentTree()
    
    // 将内容树转换为导航数据格式，使用图标名称字符串
    const navMain = contentTree.map(item => ({
      title: item.title,
      url: item.type === 'file' ? `/docs?path=${encodeURIComponent(item.path)}` : '#',
      icon: item.type === 'folder' ? 'FolderOpen' : 'FileText', // 使用字符串而不是组件
      isActive: false,
      items: item.children ? item.children.map(child => ({
        title: child.title,
        url: child.type === 'file' ? `/docs?path=${encodeURIComponent(child.path)}` : '#',
      })) : undefined
    }))
    
    return NextResponse.json({ navMain })
  } catch (error) {
    console.error('Error loading content tree:', error)
    
    // 返回默认导航数据
    const defaultNavMain = [
      {
        title: "博客文档",
        url: "#",
        icon: 'BookOpen', // 使用字符串
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
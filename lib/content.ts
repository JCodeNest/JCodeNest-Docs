import fs from 'fs'
import path from 'path'

export interface ContentItem {
  name: string
  title: string
  type: 'folder' | 'file'
  path: string
  order: number
  children?: ContentItem[]
}

// 从文件名中提取排序号和标题
function parseFileName(fileName: string): { order: number; title: string } {
  const match = fileName.match(/^(\d+)-(.+?)(\.[^.]*)?$/)
  if (match) {
    return {
      order: parseInt(match[1], 10),
      title: match[2]
    }
  }
  // 如果没有数字前缀，默认排序为999
  return {
    order: 999,
    title: fileName.replace(/\.[^.]*$/, '') // 移除文件扩展名
  }
}

// 递归读取目录结构
function readDirectoryStructure(dirPath: string, basePath: string = ''): ContentItem[] {
  const items: ContentItem[] = []
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      // 跳过隐藏文件和README
      if (entry.name.startsWith('.') || entry.name === 'README.md') {
        continue
      }
      
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.join(basePath, entry.name)
      const { order, title } = parseFileName(entry.name)
      
      if (entry.isDirectory()) {
        // 文件夹
        const children = readDirectoryStructure(fullPath, relativePath)
        items.push({
          name: entry.name,
          title,
          type: 'folder',
          path: relativePath,
          order,
          children: children.length > 0 ? children : undefined
        })
      } else if (entry.name.endsWith('.md')) {
        // Markdown 文件
        items.push({
          name: entry.name,
          title,
          type: 'file',
          path: relativePath,
          order
        })
      }
    }
    
    // 按 order 排序
    items.sort((a, b) => a.order - b.order)
    
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }
  
  return items
}

// 获取内容目录树
export function getContentTree(): ContentItem[] {
  const contentDir = path.join(process.cwd(), 'content')
  
  if (!fs.existsSync(contentDir)) {
    console.warn('Content directory does not exist:', contentDir)
    return []
  }
  
  return readDirectoryStructure(contentDir)
}

// 根据路径获取文件内容
export async function getMarkdownContent(filePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'content', filePath)
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    return content
  } catch (error) {
    console.error(`Error reading file ${fullPath}:`, error)
    throw new Error(`Failed to read file: ${filePath}`)
  }
}

// 将内容树转换为导航数据格式
export function convertToNavData(contentTree: ContentItem[]) {
  return contentTree.map(item => ({
    title: item.title,
    url: item.type === 'file' ? `/docs/${encodeURIComponent(item.path)}` : '#',
    isActive: false,
    items: item.children ? item.children.map(child => ({
      title: child.title,
      url: child.type === 'file' ? `/docs/${encodeURIComponent(child.path)}` : '#',
    })) : undefined
  }))
}
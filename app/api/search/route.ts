import { NextResponse } from 'next/server'
import { getContentTree, getMarkdownContent } from '@/lib/content'

// 改进的搜索函数
function createSearchTerms(query: string): string[] {
  // 分割查询词并过滤空字符串
  return query.toLowerCase()
    .split(/[\s+\-_/\\]+/)
    .filter(term => term.length > 0)
}

function normalizeContent(content: string): string {
  // 移除Markdown格式符号并规范化空白字符
  return content
    .replace(/[#*`_~\[\]()]/g, ' ') // 移除Markdown符号
    .replace(/\s+/g, ' ') // 多个空白字符合并为单个空格
    .trim()
}

function calculateRelevanceScore(
  text: string, 
  searchTerms: string[], 
  isTitle: boolean = false
): { score: number; matchCount: number } {
  const normalizedText = normalizeContent(text).toLowerCase()
  let score = 0
  let matchCount = 0
  
  for (const term of searchTerms) {
    const termMatches = (normalizedText.match(new RegExp(term, 'g')) || []).length
    if (termMatches > 0) {
      matchCount += termMatches
      // 标题匹配权重更高
      score += termMatches * (isTitle ? 10 : 1)
      
      // 完整词匹配额外加分
      if (normalizedText.includes(` ${term} `) || 
          normalizedText.startsWith(`${term} `) || 
          normalizedText.endsWith(` ${term}`)) {
        score += termMatches * 5
      }
    }
  }
  
  return { score, matchCount }
}

function createHighlightedSnippet(
  content: string, 
  searchTerms: string[], 
  maxLength: number = 200
): string {
  const lines = content.split('\n')
  let bestSnippet = ''
  let bestScore = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const { score } = calculateRelevanceScore(line, searchTerms)
    if (score > bestScore) {
      bestScore = score
      // 包含前后各一行作为上下文
      const contextStart = Math.max(0, i - 1)
      const contextEnd = Math.min(lines.length - 1, i + 1)
      bestSnippet = lines.slice(contextStart, contextEnd + 1)
        .filter(l => l.trim())
        .join(' ')
    }
  }
  
  // 高亮匹配的搜索词
  let highlighted = bestSnippet
  for (const term of searchTerms) {
    const regex = new RegExp(`(${term})`, 'gi')
    highlighted = highlighted.replace(regex, '**$1**')
  }
  
  return highlighted.length > maxLength 
    ? highlighted.substring(0, maxLength) + '...'
    : highlighted
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.trim()
    const searchTerms = createSearchTerms(searchQuery)
    
    if (searchTerms.length === 0) {
      return NextResponse.json({ results: [] })
    }
    
    const contentTree = getContentTree()
    const searchResults: Array<{
      title: string
      path: string
      url: string
      type: 'title' | 'content'
      snippet?: string
      matchCount?: number
      score?: number
    }> = []

    // 递归搜索函数
    async function searchInTree(items: Array<{children?: Array<unknown>, type?: string, path?: string, title?: string}>, basePath = '') {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          await searchInTree(item.children as Array<{children?: Array<unknown>, type?: string, path?: string, title?: string}>, basePath)
        } else if (item.type === 'file' && item.path?.endsWith('.md')) {
          
          // 搜索文件标题
          if (item.title && item.path) {
            const titleResult = calculateRelevanceScore(item.title, searchTerms, true)
            if (titleResult.score > 0) {
              searchResults.push({
                title: item.title,
                path: item.path,
                url: `/docs?path=${encodeURIComponent(item.path)}`,
                type: 'title',
                matchCount: titleResult.matchCount,
                score: titleResult.score
              })
            }
          }
          }

          // 搜索文件内容
          if (item.path && item.title) {
            try {
              const content = await getMarkdownContent(item.path)
              const contentResult = calculateRelevanceScore(content, searchTerms)
              
              if (contentResult.score > 0) {
                const snippet = createHighlightedSnippet(content, searchTerms)
                
                searchResults.push({
                  title: item.title,
                  path: item.path,
                  url: `/docs?path=${encodeURIComponent(item.path)}`,
                  type: 'content',
                  snippet,
                  matchCount: contentResult.matchCount,
                score: contentResult.score
              })
            }
          } catch (error) {
            console.error(`Error reading content for ${item.path}:`, error)
          }
        }
      }
    }

    await searchInTree(contentTree)

    // 按相关性评分和类型排序
    const sortedResults = searchResults
      .sort((a, b) => {
        // 首先按类型排序，标题匹配优先级高
        if (a.type !== b.type) {
          return a.type === 'title' ? -1 : 1
        }
        // 然后按相关性评分排序
        return (b.score || 0) - (a.score || 0)
      })
      // 去除重复的内容结果（同一文档多个匹配只保留最好的）
      .reduce((acc: Array<{type: string, path: string, score?: number}>, current) => {
        if (current.type === 'content') {
          const existingIndex = acc.findIndex(
            item => item.type === 'content' && item.path === current.path
          )
          if (existingIndex !== -1) {
            // 如果当前结果更好，替换现有结果
            if ((current.score || 0) > (acc[existingIndex].score || 0)) {
              acc[existingIndex] = current
            }
            return acc
          }
        }
        acc.push(current)
        return acc
      }, [])
      .slice(0, 20) // 限制结果数量

    return NextResponse.json({ 
      results: sortedResults,
      query: searchQuery,
      searchTerms,
      total: sortedResults.length
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    )
  }
}
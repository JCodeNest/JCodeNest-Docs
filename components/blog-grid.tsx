"use client"

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from 'use-debounce';
import {
  RefreshCw,
  Search,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  BookOpen
} from "lucide-react";

interface BlogPost {
  title: string;
  summary: string;
  cover?: string;
  path: string;
  url: string;
  category: string;
  readTime?: string;
  publishDate?: string;
}

interface SearchResult {
  title: string;
  path: string;
  url: string;
  type: 'title' | 'content';
  snippet?: string;
}

// 默认封面组件
const DefaultCover = ({ title }: { title: string }) => (
  <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
    <div className="text-center">
      <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 px-2 line-clamp-2">
        {title}
      </div>
    </div>
  </div>
);

export function BlogGrid() {
  const { state } = useSidebar();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 获取随机博客文章
  const fetchRandomBlogs = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/content-tree');
      if (response.ok) {
        const data = await response.json();
        const allPosts = await extractBlogPosts(data.navMain || []);
        const randomPosts = getRandomPosts(allPosts, 6);
        setBlogPosts(randomPosts);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 从目录树中提取博客文章并获取元数据
  // 从目录树中提取博客文章并获取元数据（递归，支持任意层级）
  type NavNode = { title: string; url?: string; items?: NavNode[]; icon?: string; isActive?: boolean }
  const extractBlogPosts = async (navItems: NavNode[]): Promise<BlogPost[]> => {
    // 深度优先收集所有文件节点以及其祖先（用于确定顶级分类）
    const files: Array<{ node: NavNode; ancestors: string[] }> = []
    const dfs = (nodes: NavNode[], ancestors: string[]) => {
      for (const n of nodes) {
        if (n.items && n.items.length) {
          dfs(n.items, [...ancestors, n.title])
        } else if (n.url && n.url.includes('path=')) {
          files.push({ node: n, ancestors })
        }
      }
    }
    dfs(navItems, [])

    const results = await Promise.all(files.map(async ({ node, ancestors }) => {
      const pathMatch = node.url!.match(/path=([^&]+)/)
      if (!pathMatch) return null
      const decodedPath = decodeURIComponent(pathMatch[1])

      type Metadata = { title?: string; summary?: string; cover?: string; date?: string }
      let metadata: Metadata = {}
      try {
        const metadataResponse = await fetch(`/api/metadata?path=${encodeURIComponent(decodedPath)}`)
        if (metadataResponse.ok) {
          metadata = (await metadataResponse.json()) as Metadata
        }
      } catch {
        // 忽略元数据错误，使用默认值
      }

      const category = ancestors[0] || '未分类'
      const post: BlogPost = {
        title: metadata.title || node.title,
        summary: metadata.summary || generateSummary(node.title),
        cover: metadata.cover,
        path: decodedPath,
        url: node.url!,
        category,
        readTime: generateReadTime(),
        publishDate: metadata.date || generateDate(),
      }
      return post
    }))

    return results.filter(Boolean) as BlogPost[]
  };

  // 生成摘要（仅在没有元数据时使用）
  const generateSummary = (title: string): string => {
    const summaries = [
      "深入探讨现代前端开发的最佳实践，包含实用的代码示例和项目经验分享。",
      "从基础概念到高级应用，全面解析技术要点，助你快速掌握核心知识。",
      "结合实际项目案例，分享开发过程中的经验教训和解决方案。",
      "详细介绍相关技术栈的使用技巧，提升开发效率和代码质量。",
      "系统性地梳理知识点，为你构建完整的技术知识体系。"
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  };

  // 生成阅读时间
  const generateReadTime = (): string => {
    const times = ["3 分钟", "5 分钟", "8 分钟", "10 分钟", "12 分钟"];
    return times[Math.floor(Math.random() * times.length)];
  };

  // 生成发布日期
  const generateDate = (): string => {
    const dates = [
      "2024-01-15", "2024-01-20", "2024-01-25", 
      "2024-02-01", "2024-02-10", "2024-02-15"
    ];
    return dates[Math.floor(Math.random() * dates.length)];
  };

  // 随机选择文章
  const getRandomPosts = (posts: BlogPost[], count: number): BlogPost[] => {
    const shuffled = [...posts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // 搜索功能
  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化和搜索效果
  useEffect(() => {
    fetchRandomBlogs();
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  // 渲染博客卡片
  const renderBlogCard = (post: BlogPost, index: number) => {
    const isLarge = index === 0 || index === 3;
    
    return (
      <div
        key={post.path}
        className="cursor-pointer group"
        onClick={() => window.open(post.url, '_blank')}
      >
        <BentoGridItem
          title={post.title}
          description={
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{post.summary}</p>
              {(post.readTime || post.publishDate) && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  {post.readTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </div>
                  )}
                  {post.publishDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.publishDate}
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          header={
            <div className="relative group/image">
              {post.cover ? (
                <img
                  src={post.cover}
                  alt={post.title}
                  className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                />
              ) : (
                <DefaultCover title={post.title} />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
              <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          }
          className={cn(
            "h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
            isLarge ? "md:col-span-2" : ""
          )}
        />
      </div>
    );
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (!debouncedQuery) return null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="font-medium">搜索结果</span>
            <Badge variant="outline">{searchResults.length} 个结果</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">搜索中...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              没有找到相关结果
            </div>
          ) : (
            searchResults.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => window.open(result.url, '_blank')}
              >
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{result.title}</div>
                  {result.snippet && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {result.snippet.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{result.path}</div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* 搜索栏和刷新按钮 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索技术博客..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={fetchRandomBlogs}
          disabled={refreshing}
          className="flex items-center gap-2 px-4"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          刷新
        </Button>
      </div>

      {/* 搜索结果 */}
      {renderSearchResults()}

      {/* 博客网格 */}
      <BentoGrid className={cn(
        "w-full grid-cols-1 gap-4 max-w-none mx-0",
        state === "collapsed" ? "md:grid-cols-4 lg:grid-cols-5" : "md:grid-cols-3"
      )}>
        {blogPosts.map((post, index) => renderBlogCard(post, index))}
      </BentoGrid>
    </div>
  );
}
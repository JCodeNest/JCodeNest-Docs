"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Hash, Loader2 } from "lucide-react"
import { useDebounce } from "use-debounce"

import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"

interface SearchResult {
  title: string
  path: string
  url: string
  type: 'title' | 'content'
  snippet?: string
  matchCount?: number
}

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  // 快捷键监听
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // 搜索处理
  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    const searchDocs = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    searchDocs()
  }, [debouncedQuery])

  // 选中结果处理
  const handleSelect = (url: string) => {
    setOpen(false)
    setQuery("")
    router.push(url)
  }

  return (
    <>
      <form {...props}>
        <SidebarGroup className="py-0 mt-2">
          <SidebarGroupContent className="relative">
            <Label htmlFor="search" className="sr-only">
              搜索文档
            </Label>
            <SidebarInput
              id="search"
              placeholder="搜索文档..."
              className="pl-8 cursor-pointer"
              onClick={() => setOpen(true)}
              readOnly
              value=""
            />
            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
            <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none opacity-60">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </form>

      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="搜索文档"
        description="在文档中搜索内容和标题"
      >
        <CommandInput
          placeholder="输入关键词搜索..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">正在搜索...</span>
            </div>
          )}
          
          {!loading && debouncedQuery && debouncedQuery.length >= 2 && results.length === 0 && (
            <CommandEmpty>没有找到相关结果</CommandEmpty>
          )}
          
          {!loading && results.length > 0 && (
            <>
              {/* 标题匹配结果 */}
              {results.filter(result => result.type === 'title').length > 0 && (
                <CommandGroup heading="文档标题">
                  {results
                    .filter(result => result.type === 'title')
                    .map((result, index) => (
                      <CommandItem
                        key={`title-${index}`}
                        value={`title-${result.title}-${result.path}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-xs text-muted-foreground">{result.path}</div>
                        </div>
                        {result.matchCount && result.matchCount > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {result.matchCount} 匹配
                          </div>
                        )}
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
              
              {/* 内容匹配结果 */}
              {results.filter(result => result.type === 'content').length > 0 && (
                <CommandGroup heading="文档内容">
                  {results
                    .filter(result => result.type === 'content')
                    .slice(0, 8) // 限制内容结果数量
                    .map((result, index) => (
                      <CommandItem
                        key={`content-${index}`}
                        value={`content-${result.title}-${result.path}-${index}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-start gap-2"
                      >
                        <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.snippet && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {result.snippet.replace(/\*\*(.*?)\*\*/g, '$1')}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">{result.path}</div>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
            </>
          )}
          
          {!debouncedQuery && (
            <div className="px-2 py-4 text-center">
              <div className="text-sm text-muted-foreground">
                输入关键词开始搜索文档
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                支持搜索文档标题和内容
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

"use client"

import { useState, useMemo } from "react"
import type { ReactElement } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface JsonNode {
  key?: string
  value: unknown
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  level: number
  isLast?: boolean
  path: string
}

interface JsonDisplayProps {
  jsonString: string
  showLineNumbers?: boolean
  className?: string
}

export function JsonDisplay({ jsonString, showLineNumbers = true, className }: JsonDisplayProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set())

  const jsonLines = useMemo(() => {
    if (!jsonString) return []
    
    try {
      const parsed = JSON.parse(jsonString)
      const lines: string[] = []
      
      const traverse = (obj: unknown, level: number = 0, key?: string, isLast: boolean = true, path: string = '') => {
        const indent = '  '.repeat(level)
        const currentPath = path ? `${path}.${key || ''}` : key || ''
        const isCollapsed = collapsedPaths.has(currentPath)
        
        if (obj === null) {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(`${indent}${keyStr}null${comma}`)
        } else if (typeof obj === 'boolean') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(`${indent}${keyStr}${obj}${comma}`)
        } else if (typeof obj === 'number') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(`${indent}${keyStr}${obj}${comma}`)
        } else if (typeof obj === 'string') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(`${indent}${keyStr}"${obj}"${comma}`)
        } else if (Array.isArray(obj)) {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          
          if (isCollapsed) {
            const comma = !isLast ? ',' : ''
            lines.push(`${indent}${keyStr}[...] // ${obj.length} items${comma}`)
          } else {
            lines.push(`${indent}${keyStr}[`)
            obj.forEach((item, index) => {
              traverse(item, level + 1, undefined, index === obj.length - 1, currentPath)
            })
            const comma = !isLast ? ',' : ''
            lines.push(`${indent}]${comma}`)
          }
        } else if (typeof obj === 'object') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          
          if (isCollapsed) {
            const keys = Object.keys(obj)
            const comma = !isLast ? ',' : ''
            lines.push(`${indent}${keyStr}{...} // ${keys.length} keys${comma}`)
          } else {
            lines.push(`${indent}${keyStr}{`)
            const entries = Object.entries(obj)
            entries.forEach(([k, v], index) => {
              traverse(v, level + 1, k, index === entries.length - 1, currentPath)
            })
            const comma = !isLast ? ',' : ''
            lines.push(`${indent}}${comma}`)
          }
        }
      }
      
      traverse(parsed)
      return lines
    } catch (err) {
      return []
    }
  }, [jsonString, collapsedPaths])

  const toggleCollapse = (path: string) => {
    const newCollapsed = new Set(collapsedPaths)
    if (newCollapsed.has(path)) {
      newCollapsed.delete(path)
    } else {
      newCollapsed.add(path)
    }
    setCollapsedPaths(newCollapsed)
  }

  const renderLines = useMemo(() => {
    if (!jsonString) return []
    
    try {
      const parsed = JSON.parse(jsonString)
      const lines: ReactElement[] = []
      
      const traverse = (obj: unknown, level: number = 0, key?: string, isLast: boolean = true, path: string = '') => {
        const indent = '  '.repeat(level)
        const currentPath = path ? `${path}.${key || ''}` : key || ''
        const isCollapsed = collapsedPaths.has(currentPath)
        
        if (obj === null) {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(
            <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
              <span className="w-5 flex-shrink-0" />
              <span className="flex-1">
                <span style={{ marginLeft: `${level * 2}ch` }}>
                  <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                  <span className="text-gray-500 dark:text-gray-400">null</span>
                  <span className="text-foreground">{comma}</span>
                </span>
              </span>
            </div>
          )
        } else if (typeof obj === 'boolean') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(
            <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
              <span className="w-5 flex-shrink-0" />
              <span className="flex-1">
                <span style={{ marginLeft: `${level * 2}ch` }}>
                  <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                  <span className="text-purple-600 dark:text-purple-400">{obj.toString()}</span>
                  <span className="text-foreground">{comma}</span>
                </span>
              </span>
            </div>
          )
        } else if (typeof obj === 'number') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(
            <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
              <span className="w-5 flex-shrink-0" />
              <span className="flex-1">
                <span style={{ marginLeft: `${level * 2}ch` }}>
                  <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                  <span className="text-orange-600 dark:text-orange-400">{obj}</span>
                  <span className="text-foreground">{comma}</span>
                </span>
              </span>
            </div>
          )
        } else if (typeof obj === 'string') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          const comma = !isLast ? ',' : ''
          lines.push(
            <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
              <span className="w-5 flex-shrink-0" />
              <span className="flex-1">
                <span style={{ marginLeft: `${level * 2}ch` }}>
                  <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                  <span className="text-green-600 dark:text-green-400">&quot;{obj}&quot;</span>
                  <span className="text-foreground">{comma}</span>
                </span>
              </span>
            </div>
          )
        } else if (Array.isArray(obj)) {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          
          if (isCollapsed) {
            const comma = !isLast ? ',' : ''
            lines.push(
              <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <button
                  onClick={() => toggleCollapse(currentPath)}
                  className="flex items-center justify-center w-4 h-5 hover:bg-muted rounded-sm transition-colors mr-1 flex-shrink-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                    <span className="text-gray-500 dark:text-gray-400">[...] // {obj.length} items</span>
                    <span className="text-foreground">{comma}</span>
                  </span>
                </span>
              </div>
            )
          } else {
            lines.push(
              <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <button
                  onClick={() => toggleCollapse(currentPath)}
                  className="flex items-center justify-center w-4 h-5 hover:bg-muted rounded-sm transition-colors mr-1 flex-shrink-0"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                    <span className="text-foreground">[</span>
                  </span>
                </span>
              </div>
            )
            obj.forEach((item, index) => {
              traverse(item, level + 1, undefined, index === obj.length - 1, currentPath)
            })
            const comma = !isLast ? ',' : ''
            lines.push(
              <div key={`${currentPath}-close-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-foreground">]{comma}</span>
                  </span>
                </span>
              </div>
            )
          }
        } else if (typeof obj === 'object') {
          const keyStr = key !== undefined ? `"${key}": ` : ''
          
          if (isCollapsed) {
            const keys = Object.keys(obj)
            const comma = !isLast ? ',' : ''
            lines.push(
              <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <button
                  onClick={() => toggleCollapse(currentPath)}
                  className="flex items-center justify-center w-4 h-5 hover:bg-muted rounded-sm transition-colors mr-1 flex-shrink-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                    <span className="text-gray-500 dark:text-gray-400">{`{...} // ${keys.length} keys`}</span>
                    <span className="text-foreground">{comma}</span>
                  </span>
                </span>
              </div>
            )
          } else {
            lines.push(
              <div key={`${currentPath}-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <button
                  onClick={() => toggleCollapse(currentPath)}
                  className="flex items-center justify-center w-4 h-5 hover:bg-muted rounded-sm transition-colors mr-1 flex-shrink-0"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-blue-600 dark:text-blue-400">{keyStr}</span>
                    <span className="text-foreground">{"{"}</span>
                  </span>
                </span>
              </div>
            )
            const entries = Object.entries(obj)
            entries.forEach(([k, v], index) => {
              traverse(v, level + 1, k, index === entries.length - 1, currentPath)
            })
            const comma = !isLast ? ',' : ''
            lines.push(
              <div key={`${currentPath}-close-${lines.length}`} className="flex items-start font-mono text-sm leading-relaxed">
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1">
                  <span style={{ marginLeft: `${level * 2}ch` }}>
                    <span className="text-foreground">{"}"}{comma}</span>
                  </span>
                </span>
              </div>
            )
          }
        }
      }
      
      traverse(parsed)
      return lines
    } catch (err) {
      return []
    }
  }, [jsonString, collapsedPaths])

  if (!jsonString) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <div className="text-sm">格式化后的 JSON 将显示在这里</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full h-full bg-muted/30 rounded-md overflow-auto", className)}>
      <div className="flex">
        {showLineNumbers && (
          <div className="flex-shrink-0 bg-muted/50 px-3 py-4 border-r border-border">
            {renderLines.map((_, index) => (
              <div key={index} className="font-mono text-xs text-muted-foreground leading-relaxed text-right">
                {index + 1}
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 p-4">
          {renderLines}
        </div>
      </div>
    </div>
  )
}
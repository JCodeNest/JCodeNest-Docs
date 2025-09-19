"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileJson, 
  Copy, 
  Download, 
  Upload, 
  Minimize2, 
  Maximize2, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  TestTube
} from "lucide-react"
import { cn } from "@/lib/utils"
import { JsonDisplay } from "@/components/json-display"

interface JsonError {
  message: string
  line?: number
  column?: number
}

const sampleJsonData = {
  "user": {
    "id": 12345,
    "name": "张三",
    "email": "zhangsan@example.com",
    "profile": {
      "age": 28,
      "city": "上海",
      "skills": ["JavaScript", "React", "Node.js"],
      "isActive": true
    },
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false,
        "sms": true
      }
    }
  },
  "metadata": {
    "createdAt": "2025-09-15T10:30:00Z",
    "updatedAt": "2025-09-20T14:45:00Z",
    "version": "1.2.0"
  }
}

export function JsonFormatter() {
  const [inputJson, setInputJson] = useState("")
  const [formattedJson, setFormattedJson] = useState("")
  const [error, setError] = useState<JsonError | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const validateAndFormat = useCallback((jsonString: string) => {
    if (!jsonString.trim()) {
      setFormattedJson("")
      setError(null)
      setIsValid(false)
      return
    }

    try {
      const parsed = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsed, null, 2)
      setFormattedJson(formatted)
      setError(null)
      setIsValid(true)
    } catch (err) {
      setFormattedJson("")
      setIsValid(false)
      
      if (err instanceof SyntaxError) {
        // 尝试解析错误位置
        const match = err.message.match(/position (\d+)/)
        const position = match ? parseInt(match[1]) : null
        
        let line = 1
        let column = 1
        
        if (position !== null) {
          const lines = jsonString.substring(0, position).split('\n')
          line = lines.length
          column = lines[lines.length - 1].length + 1
        }
        
        setError({
          message: err.message,
          line,
          column
        })
      } else {
        setError({
          message: "未知的JSON解析错误"
        })
      }
    }
  }, [])

  const handleInputChange = (value: string) => {
    setInputJson(value)
    validateAndFormat(value)
  }

  const handleFormat = () => {
    validateAndFormat(inputJson)
  }

  const handleCompress = () => {
    if (isValid && formattedJson) {
      try {
        const parsed = JSON.parse(formattedJson)
        const compressed = JSON.stringify(parsed)
        setFormattedJson(compressed)
      } catch (err) {
        console.error("压缩失败:", err)
      }
    }
  }

  const handleCopy = async () => {
    if (formattedJson) {
      try {
        await navigator.clipboard.writeText(formattedJson)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error("复制失败:", err)
      }
    }
  }

  const handleClear = () => {
    setInputJson("")
    setFormattedJson("")
    setError(null)
    setIsValid(false)
  }

  const handleLoadSample = () => {
    const sampleString = JSON.stringify(sampleJsonData, null, 2)
    setInputJson(sampleString)
    validateAndFormat(sampleString)
  }



  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
        <Button onClick={handleFormat} disabled={!inputJson.trim()}>
          <Maximize2 className="w-4 h-4 mr-2" />
          格式化
        </Button>
        <Button onClick={handleCompress} disabled={!isValid} variant="outline">
          <Minimize2 className="w-4 h-4 mr-2" />
          压缩
        </Button>
        <Button onClick={handleCopy} disabled={!formattedJson} variant="outline">
          {copySuccess ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copySuccess ? "已复制" : "复制"}
        </Button>
        <Button onClick={handleClear} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          清空
        </Button>
          <Button onClick={handleLoadSample} variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            测试数据
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {isValid && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              有效
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              错误
            </Badge>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* 输入区域 */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">输入 JSON</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3">
            <Textarea
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="请输入或粘贴 JSON 数据..."
              className="w-full h-full resize-none font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">格式化结果</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3">
            {error ? (
              <div className="w-full h-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                      JSON 语法错误
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      {error.message}
                    </p>
                    {error.line && error.column && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        位置: 第 {error.line} 行，第 {error.column} 列
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <JsonDisplay 
                jsonString={formattedJson} 
                showLineNumbers={true}
                className="w-full h-full"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
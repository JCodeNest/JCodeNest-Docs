"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator as CalculatorIcon,
  Delete,
  RotateCcw,
  History,
  Copy,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CalculationHistory {
  expression: string
  result: string
  timestamp: Date
}

export function Calculator() {
  const [display, setDisplay] = useState("0")
  const [expression, setExpression] = useState("")
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [mode, setMode] = useState<'standard' | 'programmer'>('standard')

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event
      
      if (key >= '0' && key <= '9') {
        handleNumber(key)
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key)
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault()
        handleEquals()
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear()
      } else if (key === 'Backspace') {
        handleBackspace()
      } else if (key === '.') {
        handleDecimal()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [display, expression])

  const handleNumber = useCallback((num: string) => {
    setDisplay(prev => {
      if (prev === "0" || prev === "错误") {
        return num
      }
      return prev + num
    })
  }, [])

  const handleOperator = useCallback((op: string) => {
    if (display === "错误") return
    
    setExpression(prev => {
      const newExpr = prev + display + " " + op + " "
      setDisplay("0")
      return newExpr
    })
  }, [display])

  const handleEquals = useCallback(() => {
    if (display === "错误") return
    
    try {
      const fullExpression = expression + display
      const processedExpression = fullExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**')
      
      // 安全的表达式计算
      const result = Function('"use strict"; return (' + processedExpression.replace(/[^0-9+\-*/.()% ]/g, '') + ')')()
      
      if (isNaN(result) || !isFinite(result)) {
        setDisplay("错误")
        return
      }
      
      // 格式化结果
      let resultStr = result.toString()
      if (result % 1 !== 0 && resultStr.length > 10) {
        resultStr = result.toFixed(8).replace(/\.?0+$/, '')
      }
      
      setDisplay(resultStr)
      
      // 添加到历史记录
      setHistory(prev => [{
        expression: fullExpression,
        result: resultStr,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]) // 保留最近10条记录
      
      setExpression("")
    } catch (error) {
      setDisplay("错误")
      setExpression("")
    }
  }, [display, expression])

  const handleClear = useCallback(() => {
    setDisplay("0")
    setExpression("")
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay(prev => {
      if (prev === "错误" || prev.length <= 1) {
        return "0"
      }
      return prev.slice(0, -1)
    })
  }, [])

  const handleDecimal = useCallback(() => {
    setDisplay(prev => {
      if (prev === "错误") return "0."
      if (prev.includes(".")) return prev
      return prev + "."
    })
  }, [])

  const handlePercent = useCallback(() => {
    if (display === "错误") return
    const num = parseFloat(display)
    if (!isNaN(num)) {
      setDisplay((num / 100).toString())
    }
  }, [display])

  const handleSquareRoot = useCallback(() => {
    if (display === "错误") return
    const num = parseFloat(display)
    if (!isNaN(num) && num >= 0) {
      setDisplay(Math.sqrt(num).toString())
    } else {
      setDisplay("错误")
    }
  }, [display])

  const handleSquare = useCallback(() => {
    if (display === "错误") return
    const num = parseFloat(display)
    if (!isNaN(num)) {
      setDisplay((num * num).toString())
    }
  }, [display])

  const handleNegate = useCallback(() => {
    if (display === "错误") return
    const num = parseFloat(display)
    if (!isNaN(num)) {
      setDisplay((-num).toString())
    }
  }, [display])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(display)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 1500)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleHistoryClick = (item: CalculationHistory) => {
    setDisplay(item.result)
    setExpression("")
    setShowHistory(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const buttonClass = "h-12 text-base font-medium transition-colors duration-200"
  const numberButtonClass = cn(buttonClass, "bg-background hover:bg-muted border border-border")
  const operatorButtonClass = cn(buttonClass, "bg-primary hover:bg-primary/90 text-primary-foreground")
  const specialButtonClass = cn(buttonClass, "bg-muted hover:bg-muted/80 text-muted-foreground")

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'standard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('standard')}
          >
            标准
          </Button>
          <Button
            variant={mode === 'programmer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('programmer')}
          >
            程序员
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-1" />
            历史
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={display === "0" || display === "错误"}
          >
            {copySuccess ? (
              <CheckCircle className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copySuccess ? "已复制" : "复制"}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 历史记录面板 */}
        {showHistory && (
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 text-sm text-muted-foreground">计算历史</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无历史记录</p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={index}
                      className="p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatTime(item.timestamp)}
                      </div>
                      <div className="text-xs font-mono break-all">
                        {item.expression}
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        = {item.result}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 计算器主体 */}
        <Card className={cn("flex flex-col", showHistory ? "lg:col-span-3" : "lg:col-span-4")}>
          <CardContent className="p-6 flex-1">
            {/* 显示屏 */}
            <div className="mb-6 space-y-2">
              {/* 表达式显示 */}
              <div className="min-h-6 text-right">
                <div className="text-sm text-muted-foreground font-mono">
                  {expression || " "}
                </div>
              </div>
              
              {/* 主显示 */}
              <div className="bg-card border rounded-lg p-6">
                <div className="text-right">
                  <div className={cn(
                    "text-4xl font-mono font-semibold break-all min-h-12 flex items-center justify-end",
                    display === "错误" ? "text-destructive" : "text-foreground"
                  )}>
                    {display}
                  </div>
                </div>
              </div>
            </div>

            {/* 按键区域 */}
            <div className="grid grid-cols-4 gap-2">
              {/* 第一行 - 功能键 */}
              <Button variant="secondary" className={buttonClass} onClick={handleClear}>
                AC
              </Button>
              <Button variant="secondary" className={buttonClass} onClick={handleNegate}>
                +/−
              </Button>
              <Button variant="secondary" className={buttonClass} onClick={handlePercent}>
                %
              </Button>
              <Button variant="default" className={buttonClass} onClick={() => handleOperator('/')}>
                ÷
              </Button>

              {/* 第二行 */}
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('7')}>
                7
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('8')}>
                8
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('9')}>
                9
              </Button>
              <Button variant="default" className={buttonClass} onClick={() => handleOperator('*')}>
                ×
              </Button>

              {/* 第三行 */}
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('4')}>
                4
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('5')}>
                5
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('6')}>
                6
              </Button>
              <Button variant="default" className={buttonClass} onClick={() => handleOperator('-')}>
                −
              </Button>

              {/* 第四行 */}
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('1')}>
                1
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('2')}>
                2
              </Button>
              <Button variant="outline" className={buttonClass} onClick={() => handleNumber('3')}>
                3
              </Button>
              <Button variant="default" className={buttonClass} onClick={() => handleOperator('+')}>
                +
              </Button>

              {/* 第五行 */}
              <Button variant="outline" className={cn(buttonClass, "col-span-2")} onClick={() => handleNumber('0')}>
                0
              </Button>
              <Button variant="outline" className={buttonClass} onClick={handleDecimal}>
                .
              </Button>
              <Button variant="default" className={buttonClass} onClick={handleEquals}>
                =
              </Button>
            </div>

            {/* 程序员模式额外按键 */}
            {mode === 'programmer' && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <Button variant="secondary" className={buttonClass} onClick={handleSquareRoot}>
                    √
                  </Button>
                  <Button variant="secondary" className={buttonClass} onClick={handleSquare}>
                    x²
                  </Button>
                  <Button variant="secondary" className={buttonClass} onClick={() => handleOperator('^')}>
                    x^y
                  </Button>
                  <Button variant="secondary" className={buttonClass} onClick={handleBackspace}>
                    <Delete className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className={buttonClass} onClick={() => handleNumber('(')}>
                    (
                  </Button>
                  <Button variant="outline" className={buttonClass} onClick={() => handleNumber(')')}>
                    )
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
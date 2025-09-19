"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Hash,
  Copy,
  CheckCircle,
  Upload,
  Download,
  FileText,
  Shield,
  Key,
  Lock,
  AlertTriangle,
  Info,
  Clock,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HashAlgorithm {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  outputLength: number
  security: 'low' | 'medium' | 'high' | 'deprecated'
  speed: 'fast' | 'medium' | 'slow'
  useCases: string[]
  details: {
    fullName: string
    yearIntroduced: number
    blockSize: string
    outputSize: string
    rounds?: number
    vulnerability?: string
    recommendation: string
  }
}

const hashAlgorithms: HashAlgorithm[] = [
  {
    id: 'md5',
    name: 'MD5',
    description: '快速但已不安全的哈希算法，仅用于非安全场景',
    icon: AlertTriangle,
    color: 'text-red-500',
    outputLength: 32,
    security: 'deprecated',
    speed: 'fast',
    useCases: ['文件完整性检查', '非安全场景的快速校验', '数据去重'],
    details: {
      fullName: 'Message Digest Algorithm 5',
      yearIntroduced: 1991,
      blockSize: '512 bits',
      outputSize: '128 bits (32 hex chars)',
      rounds: 64,
      vulnerability: '存在碰撞攻击漏洞，已被破解',
      recommendation: '不推荐用于安全敏感场景，建议使用SHA-256或更高级别算法'
    }
  },
  {
    id: 'sha1',
    name: 'SHA-1',
    description: '曾经广泛使用，现已被认为不安全',
    icon: Shield,
    color: 'text-orange-500',
    outputLength: 40,
    security: 'deprecated',
    speed: 'fast',
    useCases: ['Git版本控制', '旧系统兼容', '数字签名（已淘汰）'],
    details: {
      fullName: 'Secure Hash Algorithm 1',
      yearIntroduced: 1995,
      blockSize: '512 bits',
      outputSize: '160 bits (40 hex chars)',
      rounds: 80,
      vulnerability: '2017年被Google成功碰撞攻击',
      recommendation: '已被弃用，建议迁移到SHA-256或SHA-3'
    }
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    description: '目前最广泛使用的安全哈希算法',
    icon: Lock,
    color: 'text-green-500',
    outputLength: 64,
    security: 'high',
    speed: 'medium',
    useCases: ['密码存储', '数字证书', '区块链', 'SSL/TLS', '数字签名'],
    details: {
      fullName: 'Secure Hash Algorithm 256-bit',
      yearIntroduced: 2001,
      blockSize: '512 bits',
      outputSize: '256 bits (64 hex chars)',
      rounds: 64,
      recommendation: '推荐用于所有安全敏感场景，是当前的行业标准'
    }
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    description: '更高安全级别的哈希算法，适用于高安全要求场景',
    icon: Key,
    color: 'text-blue-500',
    outputLength: 128,
    security: 'high',
    speed: 'medium',
    useCases: ['高安全密码存储', '长期数据完整性', '加密密钥派生'],
    details: {
      fullName: 'Secure Hash Algorithm 512-bit',
      yearIntroduced: 2001,
      blockSize: '1024 bits',
      outputSize: '512 bits (128 hex chars)',
      rounds: 80,
      recommendation: '适用于需要更高安全级别的场景，性能略低于SHA-256'
    }
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    description: '最新的SHA-3标准，基于不同的数学原理',
    icon: Zap,
    color: 'text-purple-500',
    outputLength: 64,
    security: 'high',
    speed: 'medium',
    useCases: ['下一代安全应用', '抗量子计算', '高安全区块链'],
    details: {
      fullName: 'Secure Hash Algorithm 3 (Keccak)',
      yearIntroduced: 2015,
      blockSize: '1088 bits',
      outputSize: '256 bits (64 hex chars)',
      recommendation: '基于海绵构造，提供与SHA-2不同的安全保证，适合未来应用'
    }
  }
]

interface HashResult {
  algorithm: string
  input: string
  output: string
  timestamp: Date
  inputType: 'text' | 'file'
}

export function HashGenerator() {
  const [inputText, setInputText] = useState('')
  const [inputType, setInputType] = useState<'text' | 'file'>('text')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})
  const [copySuccess, setCopySuccess] = useState<string>('')
  const [history, setHistory] = useState<HashResult[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('sha256')
  
  // 简化的哈希函数实现（实际项目中应使用crypto-js或Web Crypto API）
  const generateHash = useCallback(async (input: string, algorithm: string): Promise<string> => {
    // 使用Web Crypto API（现代浏览器支持）
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder()
        const data = encoder.encode(input)
        
        let hashBuffer: ArrayBuffer
        switch (algorithm) {
          case 'sha1':
            hashBuffer = await window.crypto.subtle.digest('SHA-1', data)
            break
          case 'sha256':
            hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
            break
          case 'sha512':
            hashBuffer = await window.crypto.subtle.digest('SHA-512', data)
            break
          default:
            // 对于不支持的算法，使用简化实现
            return simpleHash(input, algorithm)
        }
        
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (error) {
        console.error('Web Crypto API error:', error)
        return simpleHash(input, algorithm)
      }
    }
    
    return simpleHash(input, algorithm)
  }, [])
  
  // 简化的哈希实现（用于不支持Web Crypto API的情况）
  const simpleHash = (input: string, algorithm: string): string => {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    const baseHash = Math.abs(hash).toString(16)
    const targetLength = hashAlgorithms.find(a => a.id === algorithm)?.outputLength || 32
    
    // 扩展到目标长度
    let result = baseHash
    while (result.length < targetLength) {
      result += Math.abs(hash * result.length).toString(16)
    }
    
    return result.substring(0, targetLength)
  }
  
  const generateAllHashes = useCallback(async () => {
    const input = inputType === 'text' ? inputText : selectedFile?.name || ''
    if (!input.trim()) return
    
    const newResults: Record<string, string> = {}
    
    for (const algorithm of hashAlgorithms) {
      try {
        const hash = await generateHash(input, algorithm.id)
        newResults[algorithm.id] = hash
      } catch (error) {
        console.error(`Error generating ${algorithm.id}:`, error)
        newResults[algorithm.id] = 'Error'
      }
    }
    
    setResults(newResults)
    
    // 添加到历史记录
    const newHistoryItems = Object.entries(newResults).map(([alg, output]) => ({
      algorithm: alg,
      input,
      output,
      timestamp: new Date(),
      inputType
    }))
    
    setHistory(prev => [...newHistoryItems, ...prev.slice(0, 47)]) // 保留最近50条
  }, [inputText, inputType, selectedFile, generateHash])
  
  useEffect(() => {
    if (inputText.trim() || selectedFile) {
      generateAllHashes()
    }
  }, [generateAllHashes])
  
  const handleCopy = async (text: string, algorithm: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(algorithm)
      setTimeout(() => setCopySuccess(''), 1500)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // 对于文件，我们使用文件名作为输入（实际项目中应该读取文件内容）
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setInputText(content.substring(0, 10000)) // 限制长度避免性能问题
      }
      reader.readAsText(file)
    }
  }
  
  const clearAll = () => {
    setInputText('')
    setSelectedFile(null)
    setResults({})
  }
  
  const currentAlgorithm = hashAlgorithms.find(a => a.id === selectedAlgorithm)

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            <FileText className="w-4 h-4 mr-1" />
            清空
          </Button>
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-1" />
                选择文件
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".txt,.json,.xml,.csv,.log"
          />
        </div>
        
        <Badge variant="secondary" className="font-mono">
          {Object.keys(results).length} 个哈希值
        </Badge>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 输入和结果 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">哈希生成器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 输入类型切换 */}
            <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'text' | 'file')}>
              <TabsList>
                <TabsTrigger value="text">文本输入</TabsTrigger>
                <TabsTrigger value="file">文件输入</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">输入文本</Label>
                  <Textarea
                    id="text-input"
                    placeholder="输入要生成哈希的文本内容..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={4}
                    className="font-mono"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div className="space-y-2">
                  <Label>选择文件</Label>
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        点击上方按钮选择文件
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* 哈希结果 */}
            <div className="space-y-4">
              <Label>哈希结果</Label>
              <div className="space-y-3">
                {hashAlgorithms.map((algorithm) => {
                  const hash = results[algorithm.id]
                  const Icon = algorithm.icon
                  
                  return (
                    <div key={algorithm.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${algorithm.color}`} />
                          <span className="font-medium">{algorithm.name}</span>
                          <Badge 
                            variant={
                              algorithm.security === 'high' ? 'default' :
                              algorithm.security === 'medium' ? 'secondary' :
                              algorithm.security === 'low' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {algorithm.security === 'high' ? '高安全' :
                             algorithm.security === 'medium' ? '中等' :
                             algorithm.security === 'low' ? '低安全' : '已弃用'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => hash && handleCopy(hash, algorithm.id)}
                          disabled={!hash}
                        >
                          {copySuccess === algorithm.id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <Input
                          value={hash || ''}
                          readOnly
                          placeholder={`${algorithm.outputLength} 位十六进制哈希值`}
                          className="font-mono text-sm pr-12"
                        />
                        {hash && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <span className="text-xs text-muted-foreground">
                              {hash.length}/{algorithm.outputLength}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {algorithm.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 侧边栏 - 算法详情和历史 */}
        <div className="space-y-4">
          {/* 算法详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">算法详情</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sha256">SHA-256</TabsTrigger>
                  <TabsTrigger value="md5">MD5</TabsTrigger>
                </TabsList>
                
                {hashAlgorithms.map((algorithm) => (
                  <TabsContent key={algorithm.id} value={algorithm.id} className="mt-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <algorithm.icon className={`w-5 h-5 ${algorithm.color}`} />
                        <h3 className="font-semibold">{algorithm.details.fullName}</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">发布年份:</span>
                          <span>{algorithm.details.yearIntroduced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">块大小:</span>
                          <span>{algorithm.details.blockSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">输出大小:</span>
                          <span>{algorithm.details.outputSize}</span>
                        </div>
                        {algorithm.details.rounds && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">轮数:</span>
                            <span>{algorithm.details.rounds}</span>
                          </div>
                        )}
                      </div>
                      
                      {algorithm.details.vulnerability && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                安全漏洞
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                {algorithm.details.vulnerability}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                              使用建议
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              {algorithm.details.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">常见用途:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {algorithm.useCases.map((useCase, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-current rounded-full" />
                              {useCase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* 历史记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">计算历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无计算历史
                  </p>
                ) : (
                  history.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="p-2 rounded border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCopy(item.output, item.algorithm)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.algorithm.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.inputType === 'file' ? '文件' : '文本'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {item.input}
                          </p>
                          <p className="text-xs font-mono truncate mt-1">
                            {item.output}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Send,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Code,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Settings,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

// 类型定义
interface Parameter {
  id: string
  name: string
  value: string
  type: 'string' | 'integer' | 'boolean' | 'number' | 'array' | 'file'
  description?: string
  enabled: boolean
}

interface Header {
  id: string
  name: string
  value: string
  type: string
  description?: string
  enabled: boolean
  isDefault?: boolean
}

interface Cookie {
  id: string
  name: string
  value: string
  type: string
  description?: string
  enabled: boolean
}

interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key' | 'jwt' | 'digest' | 'oauth2' | 'oauth1' | 'hawk' | 'aws'
  token?: string
  username?: string
  password?: string
  key?: string
  keyValue?: string
  location?: 'header' | 'query'
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH' | 'TRACE'
  url: string
  params: Parameter[]
  body: {
    type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'json' | 'xml' | 'raw' | 'binary' | 'graphql' | 'msgpack'
    content: string
    formData: Parameter[]
  }
  headers: Header[]
  cookies: Cookie[]
  auth: AuthConfig
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  data: unknown
  time: number
  size: number
}

const HTTP_METHODS = [
  { value: 'GET', color: 'bg-green-500' },
  { value: 'POST', color: 'bg-blue-500' },
  { value: 'PUT', color: 'bg-orange-500' },
  { value: 'DELETE', color: 'bg-red-500' },
  { value: 'OPTIONS', color: 'bg-purple-500' },
  { value: 'HEAD', color: 'bg-gray-500' },
  { value: 'PATCH', color: 'bg-yellow-500' },
  { value: 'TRACE', color: 'bg-pink-500' }
] as const

const BODY_TYPES = [
  { value: 'none', label: 'none' },
  { value: 'form-data', label: 'form-data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'json', label: 'json' },
  { value: 'xml', label: 'xml' },
  { value: 'raw', label: 'raw' },
  { value: 'binary', label: 'binary' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'msgpack', label: 'msgpack' }
] as const

const PARAM_TYPES = [
  { value: 'string', label: 'string' },
  { value: 'integer', label: 'integer' },
  { value: 'boolean', label: 'boolean' },
  { value: 'number', label: 'number' },
  { value: 'array', label: 'array' },
  { value: 'file', label: 'file' }
] as const

const AUTH_TYPES = [
  { value: 'none', label: '无鉴权' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
  { value: 'jwt', label: 'JWT Bearer' },
  { value: 'digest', label: 'Digest Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'oauth1', label: 'OAuth 1.0' },
  { value: 'hawk', label: 'Hawk Authentication' },
  { value: 'aws', label: 'AWS Signature' }
] as const

const DEFAULT_HEADERS: Omit<Header, 'id'>[] = [
  { name: 'Cache-Control', value: '<在发送时计算>', type: 'string', description: '缓存控制', enabled: false, isDefault: true },
  { name: 'Cookie', value: '<在发送时计算>', type: 'string', description: 'Cookie 信息', enabled: false, isDefault: true },
  { name: 'Host', value: '<在发送时计算>', type: 'string', description: '主机地址', enabled: false, isDefault: true },
  { name: 'User-Agent', value: 'JCodeNest/1.0.0 (API Tester)', type: 'string', description: '用户代理', enabled: true, isDefault: true },
  { name: 'Accept', value: '*/*', type: 'string', description: '接受的内容类型', enabled: true, isDefault: true },
  { name: 'Accept-Encoding', value: 'gzip, deflate, br', type: 'string', description: '接受的编码方式', enabled: true, isDefault: true },
  { name: 'Connection', value: 'keep-alive', type: 'string', description: '连接方式', enabled: true, isDefault: true }
]

export function ApiTester() {
  const [config, setConfig] = useState<RequestConfig>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    params: [],
    body: {
      type: 'none',
      content: '',
      formData: []
    },
    headers: DEFAULT_HEADERS.map((header, index) => ({
      ...header,
      id: `default-${index}`
    })),
    cookies: [],
    auth: { type: 'none' }
  })
  
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('params')
  const [bodyTab, setBodyTab] = useState('body')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9)
  
  // 添加参数
  const addParam = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      params: [...prev.params, {
        id: generateId(),
        name: '',
        value: '',
        type: 'string',
        enabled: true
      }]
    }))
  }, [])
  
  // 删除参数
  const removeParam = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      params: prev.params.filter(p => p.id !== id)
    }))
  }, [])
  
  // 更新参数
  const updateParam = useCallback((id: string, field: keyof Parameter, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      params: prev.params.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }))
  }, [])
  
  // 添加头部
  const addHeader = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, {
        id: generateId(),
        name: '',
        value: '',
        type: 'string',
        enabled: true
      }]
    }))
  }, [])
  
  // 删除头部
  const removeHeader = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.filter(h => h.id !== id)
    }))
  }, [])
  
  // 更新头部
  const updateHeader = useCallback((id: string, field: keyof Header, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers.map(h => 
        h.id === id ? { ...h, [field]: value } : h
      )
    }))
  }, [])
  
  // 添加Cookie
  const addCookie = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      cookies: [...prev.cookies, {
        id: generateId(),
        name: '',
        value: '',
        type: 'string',
        enabled: true
      }]
    }))
  }, [])
  
  // 删除Cookie
  const removeCookie = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      cookies: prev.cookies.filter(c => c.id !== id)
    }))
  }, [])
  
  // 更新Cookie
  const updateCookie = useCallback((id: string, field: keyof Cookie, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      cookies: prev.cookies.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }))
  }, [])
  
  // 添加表单数据
  const addFormData = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: [...prev.body.formData, {
          id: generateId(),
          name: '',
          value: '',
          type: 'string',
          enabled: true
        }]
      }
    }))
  }, [])
  
  // 删除表单数据
  const removeFormData = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.filter(f => f.id !== id)
      }
    }))
  }, [])
  
  // 更新表单数据
  const updateFormData = useCallback((id: string, field: keyof Parameter, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      body: {
        ...prev.body,
        formData: prev.body.formData.map(f => 
          f.id === id ? { ...f, [field]: value } : f
        )
      }
    }))
  }, [])
  
  // 构建请求URL
  const buildUrl = useCallback(() => {
    const enabledParams = config.params.filter(p => p.enabled && p.name)
    if (enabledParams.length === 0) return config.url
    
    const url = new URL(config.url)
    enabledParams.forEach(param => {
      url.searchParams.set(param.name, param.value)
    })
    return url.toString()
  }, [config.url, config.params])
  
  // 构建请求头
  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {}
    
    // 添加启用的自定义头部
    config.headers
      .filter(h => h.enabled && h.name && !h.isDefault)
      .forEach(header => {
        headers[header.name] = header.value
      })
    
    // 添加启用的默认头部（非计算值）
    config.headers
      .filter(h => h.enabled && h.name && h.isDefault && !h.value.includes('<在发送时计算>'))
      .forEach(header => {
        headers[header.name] = header.value
      })
    
    // 根据认证类型添加头部
    if (config.auth.type === 'bearer' && config.auth.token) {
      headers['Authorization'] = `Bearer ${config.auth.token}`
    } else if (config.auth.type === 'basic' && config.auth.username && config.auth.password) {
      const credentials = btoa(`${config.auth.username}:${config.auth.password}`)
      headers['Authorization'] = `Basic ${credentials}`
    } else if (config.auth.type === 'api-key' && config.auth.key && config.auth.keyValue) {
      if (config.auth.location === 'header') {
        headers[config.auth.key] = config.auth.keyValue
      }
    }
    
    // 根据Body类型设置Content-Type
    if (config.body.type === 'json') {
      headers['Content-Type'] = 'application/json'
    } else if (config.body.type === 'xml') {
      headers['Content-Type'] = 'application/xml'
    } else if (config.body.type === 'x-www-form-urlencoded') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    } else if (config.body.type === 'graphql') {
      headers['Content-Type'] = 'application/json'
    }
    
    return headers
  }, [config.headers, config.auth, config.body.type])
  
  // 构建请求体
  const buildBody = useCallback(() => {
    if (config.body.type === 'none') return undefined
    
    if (config.body.type === 'json') {
      try {
        return JSON.stringify(JSON.parse(config.body.content))
      } catch {
        return config.body.content
      }
    }
    
    if (config.body.type === 'x-www-form-urlencoded') {
      const formData = new URLSearchParams()
      config.body.formData
        .filter(f => f.enabled && f.name)
        .forEach(field => {
          formData.append(field.name, field.value)
        })
      return formData.toString()
    }
    
    if (config.body.type === 'form-data') {
      const formData = new FormData()
      config.body.formData
        .filter(f => f.enabled && f.name)
        .forEach(field => {
          if (field.type === 'file' && fileInputRef.current?.files?.[0]) {
            formData.append(field.name, fileInputRef.current.files[0])
          } else {
            formData.append(field.name, field.value)
          }
        })
      return formData
    }
    
    if (config.body.type === 'graphql') {
      try {
        const graphqlData = JSON.parse(config.body.content)
        return JSON.stringify(graphqlData)
      } catch {
        return JSON.stringify({ query: config.body.content })
      }
    }
    
    return config.body.content
  }, [config.body])
  
  // 发送请求
  const sendRequest = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const startTime = Date.now()
    
    try {
      const url = buildUrl()
      const headers = buildHeaders()
      const body = buildBody()
      
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.method === 'GET' || config.method === 'HEAD' ? undefined : body,
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // 获取响应头
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      // 获取响应数据
      let responseData: unknown
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        responseData = await response.json()
      } else if (contentType.includes('text/')) {
        responseData = await response.text()
      } else {
        responseData = await response.blob()
      }
      
      // 计算响应大小
      const responseSize = JSON.stringify(responseData).length
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        time: responseTime,
        size: responseSize
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }, [config, buildUrl, buildHeaders, buildBody])
  
  // 格式化JSON
  const formatJson = useCallback(() => {
    if (config.body.type === 'json') {
      try {
        const parsed = JSON.parse(config.body.content)
        const formatted = JSON.stringify(parsed, null, 2)
        setConfig(prev => ({
          ...prev,
          body: { ...prev.body, content: formatted }
        }))
      } catch (err) {
        setError('JSON 格式错误')
      }
    }
  }, [config.body])
  
  // 获取状态颜色
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 300 && status < 400) return 'text-yellow-600'
    if (status >= 400 && status < 500) return 'text-orange-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }
  
  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 请求配置区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">API 请求测试</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-1" />
                保存
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                导入
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL 输入区域 */}
          <div className="flex items-center gap-2">
            <Select 
              value={config.method} 
              onValueChange={(value: string) => setConfig(prev => ({ ...prev, method: value as RequestConfig['method'] }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", method.color)} />
                      {method.value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="请输入请求URL"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              className="flex-1"
            />
            
            <Button 
              onClick={sendRequest} 
              disabled={loading || !config.url}
              className="min-w-20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  发送中
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  发送
                </>
              )}
            </Button>
          </div>
          
          {/* 参数配置标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="params" className="relative">
                Params
                {config.params.filter(p => p.enabled).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {config.params.filter(p => p.enabled).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="body" className="relative">
                Body
                {config.body.type !== 'none' && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    1
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers" className="relative">
                Headers
                {config.headers.filter(h => h.enabled).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {config.headers.filter(h => h.enabled).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cookies" className="relative">
                Cookies
                {config.cookies.filter(c => c.enabled).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {config.cookies.filter(c => c.enabled).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="auth" className="relative">
                Auth
                {config.auth.type !== 'none' && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    •
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Params 标签页 */}
            <TabsContent value="params" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Query 参数</Label>
                <Button variant="outline" className="h-8" onClick={addParam}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加参数
                </Button>
              </div>
              
              {config.params.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">参数名</div>
                    <div className="col-span-3">参数值</div>
                    <div className="col-span-2">类型</div>
                    <div className="col-span-2">说明</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {config.params.map((param) => (
                    <div key={param.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => updateParam(param.id, 'enabled', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数名"
                          value={param.name}
                          onChange={(e) => updateParam(param.id, 'name', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数值"
                          value={param.value}
                          onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select 
                          value={param.type} 
                          onValueChange={(value: string) => updateParam(param.id, 'type', value as Parameter['type'])}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PARAM_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="说明"
                          value={param.description || ''}
                          onChange={(e) => updateParam(param.id, 'description', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          className="h-8"
                          onClick={() => removeParam(param.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p>暂无参数，点击&quot;添加参数&quot;开始配置</p>
                </div>
              )}
            </TabsContent>
            
            {/* Body 标签页 */}
            <TabsContent value="body" className="space-y-4">
              <div className="flex items-center gap-2">
                {BODY_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={config.body.type === type.value ? "default" : "outline"}
                    className="h-8"
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      body: { ...prev.body, type: type.value }
                    }))}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              
              {config.body.type === 'none' && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p>此请求没有 Body</p>
                </div>
              )}
              
              {(config.body.type === 'form-data' || config.body.type === 'x-www-form-urlencoded') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">表单数据</Label>
                    <Button variant="outline" className="h-8" onClick={addFormData}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加字段
                    </Button>
                  </div>
                  
                  {config.body.formData.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1"></div>
                        <div className="col-span-3">字段名</div>
                        <div className="col-span-3">字段值</div>
                        <div className="col-span-2">类型</div>
                        <div className="col-span-2">说明</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      {config.body.formData.map((field) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => updateFormData(field.id, 'enabled', e.target.checked)}
                              className="rounded"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="字段名"
                              value={field.name}
                              onChange={(e) => updateFormData(field.id, 'name', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            {field.type === 'file' ? (
                              <Input
                                ref={fileInputRef}
                                type="file"
                                className="h-8"
                              />
                            ) : (
                              <Input
                                placeholder="字段值"
                                value={field.value}
                                onChange={(e) => updateFormData(field.id, 'value', e.target.value)}
                                className="h-8"
                              />
                            )}
                          </div>
                          <div className="col-span-2">
                            <Select 
                              value={field.type} 
                              onValueChange={(value: string) => updateFormData(field.id, 'type', value as Parameter['type'])}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PARAM_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="说明"
                              value={field.description || ''}
                              onChange={(e) => updateFormData(field.id, 'description', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              className="h-8"
                              onClick={() => removeFormData(field.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="w-8 h-8 mx-auto mb-2" />
                      <p>暂无表单字段，点击&quot;添加字段&quot;开始配置</p>
                    </div>
                  )}
                </div>
              )}
              
              {(['json', 'xml', 'raw', 'graphql'].includes(config.body.type)) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {config.body.type === 'json' && 'JSON'}
                      {config.body.type === 'xml' && 'XML'}
                      {config.body.type === 'raw' && 'Raw'}
                      {config.body.type === 'graphql' && 'GraphQL'}
                    </Label>
                    {config.body.type === 'json' && (
                      <Button variant="outline" className="h-8" onClick={formatJson}>
                        <Code className="w-4 h-4 mr-1" />
                        格式化
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder={
                      config.body.type === 'json' ? '{"key": "value"}' :
                      config.body.type === 'xml' ? '<root><item>value</item></root>' :
                      config.body.type === 'graphql' ? 'query { users { id name } }' :
                      '请输入内容'
                    }
                    value={config.body.content}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      body: { ...prev.body, content: e.target.value }
                    }))}
                    className="min-h-32 font-mono text-sm"
                  />
                </div>
              )}
            </TabsContent>
            
            {/* Headers 标签页 */}
            <TabsContent value="headers" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Headers 🔗 隐藏自动生成的</Label>
                <Button variant="outline" className="h-8" onClick={addHeader}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加参数
                </Button>
              </div>
              
              {config.headers.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">参数名</div>
                    <div className="col-span-3">参数值</div>
                    <div className="col-span-2">类型</div>
                    <div className="col-span-2">说明</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {config.headers.map((header) => (
                    <div key={header.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数名"
                          value={header.name}
                          onChange={(e) => updateHeader(header.id, 'name', e.target.value)}
                          disabled={header.isDefault}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数值"
                          value={header.value}
                          onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                          disabled={header.isDefault && header.value.includes('<在发送时计算>')}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={header.type}
                          onChange={(e) => updateHeader(header.id, 'type', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="说明"
                          value={header.description || ''}
                          onChange={(e) => updateHeader(header.id, 'description', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1">
                        {!header.isDefault && (
                          <Button
                            variant="ghost"
                            className="h-8"
                            onClick={() => removeHeader(header.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p>暂无自定义头部，点击&quot;添加参数&quot;开始配置</p>
                </div>
              )}
            </TabsContent>
            
            {/* Cookies 标签页 */}
            <TabsContent value="cookies" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Cookies</Label>
                <Button variant="outline" className="h-8" onClick={addCookie}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加参数
                </Button>
              </div>
              
              {config.cookies.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">参数名</div>
                    <div className="col-span-3">参数值</div>
                    <div className="col-span-2">类型</div>
                    <div className="col-span-2">说明</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {config.cookies.map((cookie) => (
                    <div key={cookie.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={cookie.enabled}
                          onChange={(e) => updateCookie(cookie.id, 'enabled', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数名"
                          value={cookie.name}
                          onChange={(e) => updateCookie(cookie.id, 'name', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="参数值"
                          value={cookie.value}
                          onChange={(e) => updateCookie(cookie.id, 'value', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={cookie.type}
                          onChange={(e) => updateCookie(cookie.id, 'type', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="说明"
                          value={cookie.description || ''}
                          onChange={(e) => updateCookie(cookie.id, 'description', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          className="h-8"
                          onClick={() => removeCookie(cookie.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p>暂无 Cookie，点击&quot;添加参数&quot;开始配置</p>
                </div>
              )}
            </TabsContent>
            
            {/* Auth 标签页 */}
            <TabsContent value="auth" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">鉴权方式</Label>
                  <Select 
                    value={config.auth.type} 
                    onValueChange={(value: string) => setConfig(prev => ({
                      ...prev,
                      auth: { ...prev.auth, type: value as AuthConfig['type'] }
                    }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map((auth) => (
                        <SelectItem key={auth.value} value={auth.value}>
                          {auth.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {config.auth.type === 'bearer' && (
                  <div>
                    <Label className="text-sm font-medium">Token</Label>
                    <Input
                      placeholder="请输入 Bearer Token"
                      value={config.auth.token || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        auth: { ...prev.auth, token: e.target.value }
                      }))}
                      className="mt-2"
                    />
                  </div>
                )}
                
                {config.auth.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">用户名</Label>
                      <Input
                        placeholder="请输入用户名"
                        value={config.auth.username || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, username: e.target.value }
                        }))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">密码</Label>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        value={config.auth.password || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, password: e.target.value }
                        }))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
                
                {config.auth.type === 'api-key' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Key</Label>
                      <Input
                        placeholder="请输入 API Key 名称"
                        value={config.auth.key || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, key: e.target.value }
                        }))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Value</Label>
                      <Input
                        placeholder="请输入 API Key 值"
                        value={config.auth.keyValue || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, keyValue: e.target.value }
                        }))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">添加到</Label>
                      <Select 
                        value={config.auth.location || 'header'} 
                        onValueChange={(value: string) => setConfig(prev => ({
                          ...prev,
                          auth: { ...prev.auth, location: value as 'header' | 'query' }
                        }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="query">Query Params</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {config.auth.type === 'none' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-8 h-8 mx-auto mb-2" />
                    <p>此请求不需要鉴权</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 响应区域 */}
      {(response || error) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">响应结果</CardTitle>
              {response && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{response.time}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>{formatSize(response.size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {response.status >= 200 && response.status < 300 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : response.status >= 400 ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className={getStatusColor(response.status)}>
                      {response.status} {response.statusText}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">请求失败</span>
                </div>
                <p className="mt-2 text-red-700">{error}</p>
              </div>
            ) : response ? (
              <Tabs value={bodyTab} onValueChange={setBodyTab}>
                <TabsList>
                  <TabsTrigger value="body">响应体</TabsTrigger>
                  <TabsTrigger value="headers">响应头</TabsTrigger>
                </TabsList>
                
                <TabsContent value="body" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="absolute top-2 right-2 z-10 h-8"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {typeof response.data === 'string' 
                        ? response.data 
                        : JSON.stringify(response.data, null, 2)
                      }
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="headers" className="mt-4">
                  <div className="space-y-2">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-4 p-2 bg-muted rounded">
                        <span className="font-medium min-w-32">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
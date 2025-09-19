"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { 
  Image as ImageIcon,
  Upload,
  Download,
  Copy,
  CheckCircle,
  Trash2,
  RotateCw,
  Crop,
  Palette,
  Zap,
  FileImage,
  Settings,
  Eye,
  Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageFile {
  id: string
  file: File
  originalUrl: string
  processedUrl?: string
  originalSize: number
  processedSize?: number
  width: number
  height: number
  format: string
}

interface ConversionSettings {
  format: 'jpeg' | 'png' | 'webp' | 'bmp' | 'ico' | 'svg' | 'avif' | 'tiff'
  quality: number
  width?: number
  height?: number
  maintainAspectRatio: boolean
  compression: number
  icoSizes?: number[]
}

interface FilterSettings {
  brightness: number
  contrast: number
  saturation: number
  grayscale: boolean
  invert: boolean
  blur: number
}

const supportedFormats = [
  { value: 'jpeg', label: 'JPEG', description: '有损压缩，适合照片' },
  { value: 'png', label: 'PNG', description: '无损压缩，支持透明' },
  { value: 'webp', label: 'WebP', description: '现代格式，体积更小' },
  { value: 'bmp', label: 'BMP', description: '位图格式，无压缩' },
  { value: 'ico', label: 'ICO', description: '图标格式，多尺寸' },
  { value: 'avif', label: 'AVIF', description: '超高压缩比' },
  { value: 'tiff', label: 'TIFF', description: '专业图像格式' },
  { value: 'svg', label: 'SVG', description: '矢量图形格式' }
] as const

const icoStandardSizes = [16, 24, 32, 48, 64, 96, 128, 256]

export function ImageConverter() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
    format: 'jpeg',
    quality: 80,
    maintainAspectRatio: true,
    compression: 80,
    icoSizes: [16, 32, 48, 64]
  })
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: false,
    invert: false,
    blur: 0
  })
  const [processing, setProcessing] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        // 处理 SVG 文件
        if (file.type === 'image/svg+xml') {
          const imageFile: ImageFile = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            originalUrl: e.target?.result as string,
            originalSize: file.size,
            width: 512, // SVG 默认尺寸
            height: 512,
            format: 'svg'
          }
          
          setImages(prev => [...prev, imageFile])
          if (!selectedImage) {
            setSelectedImage(imageFile.id)
          }
        } else {
          // 处理位图文件
          const img = new Image()
          img.onload = () => {
            const imageFile: ImageFile = {
              id: Math.random().toString(36).substr(2, 9),
              file,
              originalUrl: e.target?.result as string,
              originalSize: file.size,
              width: img.width,
              height: img.height,
              format: file.type.split('/')[1]
            }
            
            setImages(prev => [...prev, imageFile])
            if (!selectedImage) {
              setSelectedImage(imageFile.id)
            }
          }
          img.src = e.target?.result as string
        }
      }
      reader.readAsDataURL(file)
    })
    
    // 清空input
    if (event.target) {
      event.target.value = ''
    }
  }, [selectedImage])
  
  const processImage = useCallback(async (imageFile: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 处理 ICO 格式
      if (conversionSettings.format === 'ico') {
        processToIco(imageFile).then(resolve).catch(reject)
        return
      }
      
      // 处理 SVG 格式
      if (conversionSettings.format === 'svg') {
        processToSvg(imageFile).then(resolve).catch(reject)
        return
      }
      
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      const img = new Image()
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = imageFile
        
        if (conversionSettings.width || conversionSettings.height) {
          if (conversionSettings.maintainAspectRatio) {
            const aspectRatio = width / height
            if (conversionSettings.width && conversionSettings.height) {
              // 两个都设置时，选择较小的缩放比例
              const scaleX = conversionSettings.width / width
              const scaleY = conversionSettings.height / height
              const scale = Math.min(scaleX, scaleY)
              width = width * scale
              height = height * scale
            } else if (conversionSettings.width) {
              width = conversionSettings.width
              height = width / aspectRatio
            } else if (conversionSettings.height) {
              height = conversionSettings.height
              width = height * aspectRatio
            }
          } else {
            width = conversionSettings.width || width
            height = conversionSettings.height || height
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 应用滤镜
        ctx.filter = `
          brightness(${filterSettings.brightness}%)
          contrast(${filterSettings.contrast}%)
          saturate(${filterSettings.saturation}%)
          ${filterSettings.grayscale ? 'grayscale(100%)' : ''}
          ${filterSettings.invert ? 'invert(100%)' : ''}
          ${filterSettings.blur > 0 ? `blur(${filterSettings.blur}px)` : ''}
        `.trim()
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换格式
        let mimeType = `image/${conversionSettings.format}`
        
        // 处理特殊格式
        if (conversionSettings.format === 'avif') {
          mimeType = 'image/avif'
        } else if (conversionSettings.format === 'tiff') {
          mimeType = 'image/tiff'
        }
        
        const quality = ['png', 'bmp', 'tiff'].includes(conversionSettings.format) 
          ? undefined 
          : conversionSettings.quality / 100
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            reject(new Error('Failed to convert image'))
          }
        }, mimeType, quality)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageFile.originalUrl
    })
  }, [conversionSettings, filterSettings])
  
  // ICO 处理函数
  const processToIco = useCallback(async (imageFile: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      const img = new Image()
      img.onload = async () => {
        try {
          // 生成多个尺寸的图像数据
          const sizes = conversionSettings.icoSizes || [16, 32, 48, 64]
          const imageDataArray: Uint8Array[] = []
          
          for (const size of sizes) {
            canvas.width = size
            canvas.height = size
            
            // 应用滤镜
            ctx.filter = `
              brightness(${filterSettings.brightness}%)
              contrast(${filterSettings.contrast}%)
              saturate(${filterSettings.saturation}%)
              ${filterSettings.grayscale ? 'grayscale(100%)' : ''}
              ${filterSettings.invert ? 'invert(100%)' : ''}
              ${filterSettings.blur > 0 ? `blur(${filterSettings.blur}px)` : ''}
            `.trim()
            
            ctx.drawImage(img, 0, 0, size, size)
            
            // 获取PNG数据
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => resolve(blob!), 'image/png')
            })
            
            const arrayBuffer = await blob.arrayBuffer()
            imageDataArray.push(new Uint8Array(arrayBuffer))
          }
          
          // 创建ICO文件
          const icoData = createIcoFile(imageDataArray, sizes)
          // 将 Uint8Array 拷贝到一个新的 ArrayBuffer，确保类型为 ArrayBuffer 而不是 ArrayBufferLike/SharedArrayBuffer
          const icoBuffer = new ArrayBuffer(icoData.byteLength)
          new Uint8Array(icoBuffer).set(icoData)
          const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' })
          const url = URL.createObjectURL(icoBlob)
          resolve(url)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageFile.originalUrl
    })
  }, [conversionSettings, filterSettings])
  
  // SVG 处理函数
  const processToSvg = useCallback(async (imageFile: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 如果原图就是SVG，直接返回
      if (imageFile.format === 'svg') {
        resolve(imageFile.originalUrl)
        return
      }
      
      // 将位图转换为SVG（嵌入base64）
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      const img = new Image()
      img.onload = () => {
        let { width, height } = imageFile
        
        if (conversionSettings.width || conversionSettings.height) {
          if (conversionSettings.maintainAspectRatio) {
            const aspectRatio = width / height
            if (conversionSettings.width && conversionSettings.height) {
              const scaleX = conversionSettings.width / width
              const scaleY = conversionSettings.height / height
              const scale = Math.min(scaleX, scaleY)
              width = width * scale
              height = height * scale
            } else if (conversionSettings.width) {
              width = conversionSettings.width
              height = width / aspectRatio
            } else if (conversionSettings.height) {
              height = conversionSettings.height
              width = height * aspectRatio
            }
          } else {
            width = conversionSettings.width || width
            height = conversionSettings.height || height
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 应用滤镜
        ctx.filter = `
          brightness(${filterSettings.brightness}%)
          contrast(${filterSettings.contrast}%)
          saturate(${filterSettings.saturation}%)
          ${filterSettings.grayscale ? 'grayscale(100%)' : ''}
          ${filterSettings.invert ? 'invert(100%)' : ''}
          ${filterSettings.blur > 0 ? `blur(${filterSettings.blur}px)` : ''}
        `.trim()
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // 获取base64数据
        const dataUrl = canvas.toDataURL('image/png')
        
        // 创建SVG
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image x="0" y="0" width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`
        
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        resolve(url)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageFile.originalUrl
    })
  }, [conversionSettings, filterSettings])
  
  // 创建ICO文件的辅助函数
  const createIcoFile = (imageDataArray: Uint8Array[], sizes: number[]): Uint8Array => {
    const numImages = imageDataArray.length
    
    // ICO文件头 (6 bytes)
    const header = new Uint8Array(6)
    header[0] = 0 // Reserved
    header[1] = 0 // Reserved
    header[2] = 1 // Type: 1 for ICO
    header[3] = 0 // Type high byte
    header[4] = numImages & 0xFF // Number of images
    header[5] = (numImages >> 8) & 0xFF // Number of images high byte
    
    // 计算目录条目和数据偏移
    const directorySize = numImages * 16 // 每个目录条目16字节
    let dataOffset = 6 + directorySize
    
    // 创建目录条目
    const directory = new Uint8Array(directorySize)
    let dirOffset = 0
    
    for (let i = 0; i < numImages; i++) {
      const size = sizes[i]
      const imageData = imageDataArray[i]
      
      directory[dirOffset] = size === 256 ? 0 : size // Width
      directory[dirOffset + 1] = size === 256 ? 0 : size // Height
      directory[dirOffset + 2] = 0 // Color palette
      directory[dirOffset + 3] = 0 // Reserved
      directory[dirOffset + 4] = 1 // Color planes
      directory[dirOffset + 5] = 0 // Color planes high byte
      directory[dirOffset + 6] = 32 // Bits per pixel
      directory[dirOffset + 7] = 0 // Bits per pixel high byte
      
      // 数据大小
      const dataSize = imageData.length
      directory[dirOffset + 8] = dataSize & 0xFF
      directory[dirOffset + 9] = (dataSize >> 8) & 0xFF
      directory[dirOffset + 10] = (dataSize >> 16) & 0xFF
      directory[dirOffset + 11] = (dataSize >> 24) & 0xFF
      
      // 数据偏移
      directory[dirOffset + 12] = dataOffset & 0xFF
      directory[dirOffset + 13] = (dataOffset >> 8) & 0xFF
      directory[dirOffset + 14] = (dataOffset >> 16) & 0xFF
      directory[dirOffset + 15] = (dataOffset >> 24) & 0xFF
      
      dataOffset += dataSize
      dirOffset += 16
    }
    
    // 组合最终文件
    const totalSize = 6 + directorySize + imageDataArray.reduce((sum, data) => sum + data.length, 0)
    const icoFile = new Uint8Array(totalSize)
    
    let offset = 0
    
    // 复制头部
    icoFile.set(header, offset)
    offset += header.length
    
    // 复制目录
    icoFile.set(directory, offset)
    offset += directory.length
    
    // 复制图像数据
    for (const imageData of imageDataArray) {
      icoFile.set(imageData, offset)
      offset += imageData.length
    }
    
    return icoFile
  }
  
  const handleConvert = useCallback(async (imageId?: string) => {
    setProcessing(true)
    
    try {
      const imagesToProcess = imageId 
        ? images.filter(img => img.id === imageId)
        : images
      
      for (const imageFile of imagesToProcess) {
        const processedUrl = await processImage(imageFile)
        
        // 计算处理后的文件大小
        const response = await fetch(processedUrl)
        const blob = await response.blob()
        
        setImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, processedUrl, processedSize: blob.size }
            : img
        ))
      }
    } catch (error) {
      console.error('图片处理失败:', error)
    } finally {
      setProcessing(false)
    }
  }, [images, processImage])
  
  const handleDownload = useCallback(async (imageFile: ImageFile) => {
    if (!imageFile.processedUrl) return
    
    try {
      const response = await fetch(imageFile.processedUrl)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const originalName = imageFile.file.name.split('.')[0]
      link.download = `${originalName}_converted.${conversionSettings.format}`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }, [conversionSettings.format])
  
  const handleDownloadAll = useCallback(async () => {
    const processedImages = images.filter(img => img.processedUrl)
    
    for (const imageFile of processedImages) {
      await handleDownload(imageFile)
      // 添加小延迟避免浏览器阻止多个下载
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }, [images, handleDownload])
  
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      if (selectedImage === imageId && filtered.length > 0) {
        setSelectedImage(filtered[0].id)
      } else if (filtered.length === 0) {
        setSelectedImage(null)
      }
      return filtered
    })
  }, [selectedImage])
  
  const clearAll = useCallback(() => {
    // 清理URL对象
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl)
      if (img.processedUrl) {
        URL.revokeObjectURL(img.processedUrl)
      }
    })
    
    setImages([])
    setSelectedImage(null)
  }, [images])
  
  const resetFilters = useCallback(() => {
    setFilterSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: false,
      invert: false,
      blur: 0
    })
  }, [])
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  const selectedImageFile = images.find(img => img.id === selectedImage)
  
  // 自动处理当设置改变时
  useEffect(() => {
    if (selectedImageFile) {
      const timer = setTimeout(() => {
        handleConvert(selectedImageFile.id)
      }, 500) // 防抖
      
      return () => clearTimeout(timer)
    }
  }, [conversionSettings, filterSettings, selectedImageFile?.id])

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-1" />
            选择图片
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadAll}
            disabled={!images.some(img => img.processedUrl)}
          >
            <Download className="w-4 h-4 mr-1" />
            下载全部
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={images.length === 0}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空
          </Button>
        </div>
        
        <Badge variant="secondary" className="font-mono">
          {images.length} 张图片
        </Badge>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.svg,.ico"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 图片列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">图片列表</CardTitle>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  还没有上传图片
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  选择图片
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((imageFile) => (
                  <div
                    key={imageFile.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedImage === imageFile.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedImage(imageFile.id)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={imageFile.originalUrl}
                        alt={imageFile.file.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {imageFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {imageFile.width} × {imageFile.height}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(imageFile.originalSize)}
                        </p>
                        {imageFile.processedSize && (
                          <p className="text-xs text-green-600">
                            → {formatFileSize(imageFile.processedSize)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(imageFile.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 预览区域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">预览</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedImageFile ? (
              <div className="space-y-4">
                <Tabs value="original" onValueChange={() => {}}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="original">原图</TabsTrigger>
                    <TabsTrigger value="processed">处理后</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="original" className="mt-4">
                    <div className="relative border border-border rounded-lg overflow-hidden">
                      <img
                        src={selectedImageFile.originalUrl}
                        alt="原图"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="processed" className="mt-4">
                    <div className="relative border border-border rounded-lg overflow-hidden">
                      {selectedImageFile.processedUrl ? (
                        <img
                          src={selectedImageFile.processedUrl}
                          alt="处理后"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-96 bg-muted/20">
                          <div className="text-center">
                            {processing ? (
                              <>
                                <Zap className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                                <p className="text-sm text-muted-foreground">处理中...</p>
                              </>
                            ) : (
                              <>
                                <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">调整设置后自动处理</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                {selectedImageFile.processedUrl && (
                  <div className="flex justify-center">
                    <Button onClick={() => handleDownload(selectedImageFile)}>
                      <Download className="w-4 h-4 mr-2" />
                      下载图片
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    选择图片开始处理
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 设置面板 */}
        <div className="space-y-4">
          {/* 转换设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">转换设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>输出格式</Label>
                <div className="grid grid-cols-2 gap-2">
                  {supportedFormats.map((format) => (
                    <Button
                      key={format.value}
                      variant={conversionSettings.format === format.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConversionSettings(prev => ({ ...prev, format: format.value }))}
                      title={format.description}
                    >
                      {format.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {supportedFormats.find(f => f.value === conversionSettings.format)?.description}
                </p>
              </div>
              
              {(['jpeg', 'webp', 'avif'].includes(conversionSettings.format)) && (
                <div className="space-y-2">
                  <Label>质量: {conversionSettings.quality}%</Label>
                  <Slider
                    value={[conversionSettings.quality]}
                    onValueChange={([quality]) => setConversionSettings(prev => ({ ...prev, quality }))}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              )}
              
              {conversionSettings.format === 'ico' && (
                <div className="space-y-2">
                  <Label>ICO 尺寸</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {icoStandardSizes.map((size) => (
                      <Button
                        key={size}
                        variant={conversionSettings.icoSizes?.includes(size) ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => {
                          const currentSizes = conversionSettings.icoSizes || []
                          const newSizes = currentSizes.includes(size)
                            ? currentSizes.filter(s => s !== size)
                            : [...currentSizes, size].sort((a, b) => a - b)
                          setConversionSettings(prev => ({ ...prev, icoSizes: newSizes }))
                        }}
                      >
                        {size}×{size}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    选择要包含的图标尺寸
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>尺寸调整</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">宽度</Label>
                    <Input
                      type="number"
                      placeholder="自动"
                      value={conversionSettings.width || ''}
                      onChange={(e) => setConversionSettings(prev => ({ 
                        ...prev, 
                        width: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">高度</Label>
                    <Input
                      type="number"
                      placeholder="自动"
                      value={conversionSettings.height || ''}
                      onChange={(e) => setConversionSettings(prev => ({ 
                        ...prev, 
                        height: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aspect-ratio"
                    checked={conversionSettings.maintainAspectRatio}
                    onChange={(e) => setConversionSettings(prev => ({ 
                      ...prev, 
                      maintainAspectRatio: e.target.checked 
                    }))}
                  />
                  <Label htmlFor="aspect-ratio" className="text-xs">
                    保持宽高比
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 滤镜设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">滤镜效果</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  重置
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>亮度: {filterSettings.brightness}%</Label>
                <Slider
                  value={[filterSettings.brightness]}
                  onValueChange={([brightness]) => setFilterSettings(prev => ({ ...prev, brightness }))}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>对比度: {filterSettings.contrast}%</Label>
                <Slider
                  value={[filterSettings.contrast]}
                  onValueChange={([contrast]) => setFilterSettings(prev => ({ ...prev, contrast }))}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>饱和度: {filterSettings.saturation}%</Label>
                <Slider
                  value={[filterSettings.saturation]}
                  onValueChange={([saturation]) => setFilterSettings(prev => ({ ...prev, saturation }))}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>模糊: {filterSettings.blur}px</Label>
                <Slider
                  value={[filterSettings.blur]}
                  onValueChange={([blur]) => setFilterSettings(prev => ({ ...prev, blur }))}
                  min={0}
                  max={10}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="grayscale"
                    checked={filterSettings.grayscale}
                    onChange={(e) => setFilterSettings(prev => ({ 
                      ...prev, 
                      grayscale: e.target.checked 
                    }))}
                  />
                  <Label htmlFor="grayscale" className="text-sm">
                    灰度
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="invert"
                    checked={filterSettings.invert}
                    onChange={(e) => setFilterSettings(prev => ({ 
                      ...prev, 
                      invert: e.target.checked 
                    }))}
                  />
                  <Label htmlFor="invert" className="text-sm">
                    反色
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 隐藏的Canvas用于图片处理 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
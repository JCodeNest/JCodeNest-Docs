import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface PostMetadata {
  title?: string;
  summary?: string;
  date?: string;
  cover?: string;
}

function extractFrontmatter(content: string): PostMetadata {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {};
  }

  const frontmatter = match[1];
  const metadata: PostMetadata = {};
  
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      const trimmedKey = key.trim() as keyof PostMetadata;
      if (['title', 'summary', 'date', 'cover'].includes(trimmedKey)) {
        metadata[trimmedKey] = value;
      }
    }
  }
  
  return metadata;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }
    
    // 解码文件路径
    const decodedPath = decodeURIComponent(filePath);
    const fullPath = path.join(process.cwd(), 'content', decodedPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // 提取元数据
    const metadata = extractFrontmatter(content);
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getMarkdownContent } from '@/lib/content'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')
  
  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 })
  }
  
  try {
    const content = await getMarkdownContent(filePath)
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching markdown content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' }, 
      { status: 500 }
    )
  }
}
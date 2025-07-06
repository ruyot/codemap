import { NextRequest, NextResponse } from 'next/server'
import { ErrorFlag, BlackboxResponse } from '@/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const MAX_REQUESTS = 2

export async function POST(request: NextRequest) {
  try {
    const { filePath, code, errors, userId } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
    }

    // Check request count for user
    const { data, error } = await supabase
      .from('api_usage')
      .select('count')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching API usage:', error)
      return NextResponse.json({ error: 'Failed to fetch API usage' }, { status: 500 })
    }

    if (data && data.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'API request limit reached' }, { status: 429 })
    }

    // Increment request count
    if (data) {
      await supabase
        .from('api_usage')
        .update({ count: data.count + 1 })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('api_usage')
        .insert({ user_id: userId, count: 1 })
    }

    // Real Blackbox API call
    const response = await fetch('https://api.blackbox.ai/suggest-fix', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BLACKBOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath,
        code,
        errors
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Blackbox API error:', errorText)
      return NextResponse.json({ error: 'Blackbox API error' }, { status: 500 })
    }

    const result: BlackboxResponse = await response.json()

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error getting fix suggestions:', error)
    return NextResponse.json({ error: 'Failed to get fix suggestions' }, { status: 500 })
  }
}

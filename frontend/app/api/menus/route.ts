import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const store_id = formData.get('store_id') as string
  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const thumbnail = formData.get('thumbnail') as File

  if (!store_id || !name || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Authorization check: Ensure the user owns the store
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', store_id)
    .single()

  if (storeError) {
    return NextResponse.json({ error: 'Database error fetching store data' }, { status: 500 })
  }

  if (!storeData) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  if (storeData.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden: You do not own this store' }, { status: 403 })
  }

  let thumbnailUrl = ''

  if (thumbnail) {
    const fileExtension = thumbnail.name.split('.').pop()
    const fileName = `${store_id}/${uuidv4()}.${fileExtension}`
    const { data: imageData, error: imageError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, thumbnail)

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 })
    }
    const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName)
    thumbnailUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('store_menus')
    .insert([{ store_id, name, price: parseInt(price), thumbnail: thumbnailUrl }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

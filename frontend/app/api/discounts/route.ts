import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
  const menu_id = formData.get('menu_id') as string
  const discount_rate = formData.get('discount_rate') as string
  const quantity = formData.get('quantity') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string

  const { data, error } = await supabase
    .from('discounts')
    .insert([
      {
        store_id,
        menu_id,
        discount_rate: parseInt(discount_rate),
        quantity: quantity ? parseInt(quantity) : null,
        start_time,
        end_time,
      },
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

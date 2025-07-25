import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
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

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { Database } from '@/lib/supabase/types';

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

    const newDiscount = await discountService.registerDiscount(
      {
        discount_rate: parseInt(discount_rate),
        quantity: quantity ? parseInt(quantity) : null,
        start_time,
        end_time,
      },
      store_id,
      menu_id
    );

    return NextResponse.json(newDiscount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

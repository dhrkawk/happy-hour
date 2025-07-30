import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { Database } from '@/lib/supabase/types';

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
  const discountService = new DiscountService(supabase);

  try {
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

import { NextRequest, NextResponse } from 'next/server'
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const storeId = searchParams.get('store_id');

  if (!storeId) {
    return NextResponse.json({ error: 'store_id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const discountService = new DiscountService(supabase);

  try {
    const discounts = await discountService.getDiscountsByStoreId(storeId);
    return NextResponse.json(discounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discountService = new DiscountService(supabase);

  try {
    const formData = await request.formData();
    const menu_id = formData.get('menu_id') as string;
    const discount_rate = formData.get('discount_rate') as string;
    const quantity = formData.get('quantity') as string;
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;

    const newDiscount = await discountService.registerDiscount({
      menu_id,
      discount_rate: parseInt(discount_rate),
      quantity: quantity ? parseInt(quantity) : null,
      start_time,
      end_time,
    });

    return NextResponse.json(newDiscount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

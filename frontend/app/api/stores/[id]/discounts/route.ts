import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { StoreService } from '@/lib/services/store.service';
import { Database } from '@/lib/supabase/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;
  const supabase = await createClient();
  const discountService = new DiscountService(supabase);

  try {
    const discounts = await discountService.getDiscountsByStoreId(storeId);
    return NextResponse.json(discounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '로그인된 사용자만 할인을 등록할 수 있습니다.' }, { status: 401 });
  }

  const storeService = new StoreService(supabase);
  const isOwner = await storeService.isStoreOwner(storeId, user.id);

  if (!isOwner) {
    return NextResponse.json({ error: '해당 상점의 소유자만 할인을 등록할 수 있습니다.' }, { status: 403 });
  }

  const discountService = new DiscountService(supabase);

  try {
    const { discount_rate, quantity, start_time, end_time, menu_id } = await request.json();

    if (typeof discount_rate !== 'number' || !start_time || !end_time) {
      return NextResponse.json({ error: 'Discount rate, start time, and end time are required' }, { status: 400 });
    }

    const newDiscount = await discountService.registerDiscount({
      discount_rate,
      quantity,
      start_time,
      end_time,
      menu_id,
    }, storeId);

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

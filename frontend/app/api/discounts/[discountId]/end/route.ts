import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscountService } from '@/lib/services/discounts/discount.service';

export async function PATCH(req: NextRequest, context: { params: { discountId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { discountId } = context.params;
  const discountService = new DiscountService(supabase);

  try {
    const endedDiscount = await discountService.endDiscount(discountId);
    return NextResponse.json({ success: true, discount: endedDiscount }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to end discount:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

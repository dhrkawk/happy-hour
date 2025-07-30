import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscountService } from '@/lib/services/discounts/discount.service';

export async function GET(request: Request, { params }: { params: { menuId: string } }) {
  const menuId = params.menuId;
  const supabase = await createClient();
  const discountService = new DiscountService(supabase);

  try {
    const discount = await discountService.getDiscountByMenuId(menuId);
    if (!discount) {
      return NextResponse.json({ message: 'No discount found for this menu.' }, { status: 404 });
    }
    return NextResponse.json(discount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

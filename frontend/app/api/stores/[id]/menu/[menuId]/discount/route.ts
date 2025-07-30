import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { DiscountFormViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';


export async function GET(req: NextRequest, { params }: { params: { id: string, menuId: string } }) {
  const supabase = await createClient();
  const discountService = new DiscountService(supabase);
  const menuId = params.menuId;
  try {
    const discounts = await discountService.getDiscountsByMenuId(menuId);
    return NextResponse.json({ discounts }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string, menuId: string } }) {
  const supabase = await createClient();
  const discountService = new DiscountService(supabase);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const storeId = params.id;
  const menuId = params.menuId;
  const discountData: DiscountFormViewModel = await req.json();

  try {
    const newDiscount = await discountService.registerDiscount(discountData, storeId, menuId);
    return NextResponse.json({ success: true, discount: newDiscount }, { status: 201 });
  } catch (error: any) {
    console.error('Discount registration failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

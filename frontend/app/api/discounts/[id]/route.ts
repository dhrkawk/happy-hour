import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { DiscountFormViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

const discountService = new DiscountService();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const discountId = params.id;
  const discountData: Partial<DiscountFormViewModel> = await req.json();

  try {
    const updatedDiscount = await discountService.updateDiscount(discountId, discountData);
    return NextResponse.json({ success: true, discount: updatedDiscount }, { status: 200 });
  } catch (error: any) {
    console.error('Discount update failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const discountId = params.id;

  try {
    await discountService.deleteDiscount(discountId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Discount deletion failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
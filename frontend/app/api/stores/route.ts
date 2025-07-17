import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createClient();

  // 1. stores 테이블에 insert
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert([
      {
        name: body.name,
        category: body.category,
        address: body.address,
      },
    ])
    .select()
    .single();

  if (storeError) {
    return NextResponse.json({ error: storeError.message }, { status: 500 });
  }

  // 2. discounts 테이블에 insert (thumbnail, service 포함)
  const { error: discountError } = await supabase
    .from('discounts')
    .insert([
      {
        store_id: store.id,
        service: body.service || null, // 폼에서 service 값이 오면 저장, 없으면 null
        discount: body.discount,
        original_price: body.original_price,
        discount_price: body.discount_price,
        start_at: body.start_at,
        end_at: body.end_at,
        thumbnail: body.thumbnail,
      },
    ]);

  if (discountError) {
    return NextResponse.json({ error: discountError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 
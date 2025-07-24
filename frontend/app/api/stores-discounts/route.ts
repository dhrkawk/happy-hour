import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();

  // 1. 가게 정보
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const address = formData.get('address') as string;
  const lat = Number(formData.get('lat'));
  const lng = Number(formData.get('lng'));
  const storeThumbnailFile = formData.get('store_thumbnail') as File | null;

  // 2. 메뉴 정보
  const menu_name = formData.get('menu_name') as string;
  const menu_price = Number(formData.get('menu_price'));
  const menuThumbnailFile = formData.get('menu_thumbnail') as File | null;

  // 3. 할인 정보
  const discount_rate = Number(formData.get('discount_rate'));
  const start_time = formData.get('start_time') as string;
  const end_time = formData.get('end_time') as string;
  const quantity = formData.get('quantity') ? Number(formData.get('quantity')) : null;

  // 메뉴 썸네일 업로드
  let menuThumbnailUrl: string | null = null;
  if (menuThumbnailFile) {
    const fileExtension = menuThumbnailFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, menuThumbnailFile, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    menuThumbnailUrl = publicUrlData.publicUrl;
  }

  // 가게 썸네일 업로드
  let storeThumbnailUrl: string | null = null;
  if (storeThumbnailFile) {
    const fileExtension = storeThumbnailFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, storeThumbnailFile, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Supabase store thumbnail upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    storeThumbnailUrl = publicUrlData.publicUrl;
  }

  // 1. stores 테이블에 insert
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert([
      {
        name,
        category,
        address,
        lat,
        lng,
        store_thumbnail: storeThumbnailUrl,
        activated: true,
        owner_id: user.id,
      },
    ])
    .select()
    .single();

  if (storeError) {
    console.error("Supabase store insert error:", storeError);
    return NextResponse.json({ error: storeError.message }, { status: 500 });
  }

  // 2. store_menus 테이블에 insert
  console.log("🖼️ Thumbnail URL:", menuThumbnailUrl);
  const { data: menu, error: menuError } = await supabase
    .from('store_menus')
    .insert([
      {
        store_id: store.id,
        name: menu_name,
        price: menu_price,
        thumbnail: menuThumbnailUrl,
      },
    ])
    .select()
    .single();

  if (menuError) {
    console.error("Supabase menu insert error:", menuError);
    return NextResponse.json({ error: menuError.message }, { status: 500 });
  }

  // 3. discounts 테이블에 insert
  const { error: discountError } = await supabase
    .from('discounts')
    .insert([
      {
        store_id: store.id,
        menu_id: menu.id,
        discount_rate,
        start_time,
        end_time,
        quantity,
        created_at: new Date().toISOString(),
      },
    ]);

  if (discountError) {
    console.error("Supabase discount insert error:", discountError);
    return NextResponse.json({ error: discountError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
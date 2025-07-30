import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MenuService } from '@/lib/services/menus/menu.service';
import { StoreService } from '@/lib/services/store.service';
import { Database } from '@/lib/supabase/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;
  const supabase = await createClient();
  const menuService = new MenuService(supabase);

  try {
    const menus = await menuService.getMenusByStoreId(storeId);
    return NextResponse.json(menus);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '로그인된 사용자만 메뉴를 등록할 수 있습니다.' }, { status: 401 });
  }

  const storeService = new StoreService(supabase);
  const isOwner = await storeService.isStoreOwner(storeId, user.id);

  if (!isOwner) {
    return NextResponse.json({ error: '해당 상점의 소유자만 메뉴를 등록할 수 있습니다.' }, { status: 403 });
  }

  const menuService = new MenuService(supabase);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!name || isNaN(price)) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const newMenu = await menuService.registerMenu({ name, price }, storeId, thumbnailFile);
    return NextResponse.json(newMenu, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

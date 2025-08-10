import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StoreService } from '@/lib/services/stores/store.service';

// 매장 메뉴 카테고리 조회
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const storeId = (await params).id;
  const supabase = await createClient();
  const storeService = new StoreService(supabase);

  try {
    const categories = await storeService.getStoreMenuCategories(storeId);
    return NextResponse.json(categories || []);
  } catch (error: any) {
    console.error("Error in GET /api/stores/[id]/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매장 메뉴 카테고리 업데이트
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const storeId = (await params).id;
  const supabase = await createClient();
  const storeService = new StoreService(supabase);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '로그인된 사용자만 카테고리를 업데이트할 수 있습니다.' }, { status: 401 });
  }

  const isOwner = await storeService.isStoreOwner(storeId, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: '해당 상점의 소유자만 카테고리를 업데이트할 수 있습니다.' }, { status: 403 });
  }

  try {
    const { categories } = await request.json();
    if (!Array.isArray(categories) || !categories.every(cat => typeof cat === 'string')) {
      return NextResponse.json({ error: 'Categories must be an array of strings' }, { status: 400 });
    }

    const updatedCategories = await storeService.updateStoreMenuCategories(storeId, categories);
    return NextResponse.json(updatedCategories);
  } catch (error: any) {
    console.error("Error in PATCH /api/stores/[id]/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

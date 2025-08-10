import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MenuService } from '@/lib/services/menus/menu.service';
import { Database } from '@/lib/supabase/types';

// 특정 메뉴 상세 조회
export async function GET(request: Request, { params }: { params: { id: string, menuId: string } }) {
  const { id: storeId, menuId } = await params;
  const supabase = await createClient();
  const menuService = new MenuService(supabase);

  try {
    const menu = await menuService.getMenuById(menuId);
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 메뉴 수정
export async function PATCH(request: Request, { params }: { params: { id: string, menuId: string } }) {
  const { id: storeId, menuId } = await params;
  const supabase = await createClient();
  const menuService = new MenuService(supabase);

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    const category = formData.get('category') as string | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;

    const updatePayload: { name?: string; price?: number; category?: string } = {};
    if (name) updatePayload.name = name;
    if (price !== null) updatePayload.price = price;
    if (category !== null) updatePayload.category = category;

    const updatedMenu = await menuService.updateMenu(menuId, updatePayload, thumbnailFile);
    return NextResponse.json(updatedMenu);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 메뉴 삭제
export async function DELETE(request: Request, { params }: { params: { id: string, menuId: string } }) {
  const { id: storeId, menuId } = await params;
  const supabase = await createClient();
  const menuService = new MenuService(supabase);

  try {
    await menuService.deleteMenu(menuId);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

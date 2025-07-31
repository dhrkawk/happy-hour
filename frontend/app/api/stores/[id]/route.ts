import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StoreDetailService } from '@/lib/services/stores/store-detail.service';


export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: storeId } = await context.params;
  const supabase = await createClient();
  const storeDetailService = new StoreDetailService(supabase);
  
  try {
    const storeDetail = await storeDetailService.getStoreDetailById(storeId);
    if (!storeDetail) {
      return NextResponse.json(
        { error: `Store not found with id: ${storeId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(storeDetail);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
import { createClient } from '@/lib/supabase/server';
import { StoreService } from '@/lib/services/stores/store.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const storeService = new StoreService(supabase);
    const stores = await storeService.getAllStores();
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
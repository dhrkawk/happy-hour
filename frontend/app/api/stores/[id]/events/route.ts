import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/services/events/event.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: storeId } = await params;

  if (!storeId) {
    return NextResponse.json({ error: 'store_id is required' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    const eventService = new EventService(supabase);
    const events = await eventService.getEventsByStoreId(storeId);
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error.message },
      { status: 500 }
    );
  }
}

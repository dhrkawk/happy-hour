import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { EventFormViewModel } from '@/lib/viewmodels/events/event-form.viewmodel';
import { EventService } from '@/lib/services/events/event.service';

// event 생성
export async function POST(req: NextRequest) {
  const payload: EventFormViewModel = await req.json();

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // 유효성 검사
  if (!payload?.eventData?.store_id || !payload.eventData?.title || !payload.discounts || !payload.gifts) {
    return NextResponse.json({ error: 'eventData.store_id, title, discounts, gifts are required.' }, { status: 400 });
  }

  try {
    const eventService = new EventService(supabase);
    await eventService.registerEvent(payload);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// TODO: 특정 이벤트 상세 조회


// TODO: 특정 이벤트 삭제

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EventService } from '@/lib/services/events/event.service';

// TODO: 특정 이벤트 상세 조회
export async function GET(req: NextRequest, context: { params: { eventId: string } }) {
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // const { eventId } = context.params;
  // const eventService = new EventService(supabase);

  // try {
  //   const event = await eventService.getEventById(eventId);
  //   return NextResponse.json({ success: true, event }, { status: 200 });
  // } catch (error: any) {
  //   console.error('Event retrieval failed:', error);
  //   return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  // }
}

// TODO: 특정 이벤트 수정
export async function PATCH(req: NextRequest, context: { params: { discountId: string } }) {
//   const supabase = await createClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   const { discountId } = context.params;
//   const discountData: Partial<DiscountFormViewModel> = await req.json();
//   const discountService = new DiscountService(supabase);

//   try {
//     const updatedDiscount = await discountService.updateDiscount(discountId, discountData);
//     return NextResponse.json({ success: true, discount: updatedDiscount }, { status: 200 });
//   } catch (error: any) {
//     console.error('Discount update failed:', error);
//     return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
}

// TODO: 특정 이벤트 삭제
export async function DELETE(req: NextRequest, context: { params: { eventId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { eventId } = context.params;
  const eventService = new EventService(supabase);

  try {
    await eventService.deleteEvent(eventId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Event deletion failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


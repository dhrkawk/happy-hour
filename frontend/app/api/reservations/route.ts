import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReservationService } from '@/lib/services/reservations/reservation.service';

// DB 스키마에 맞게 수정된 ReservationItem 타입
type ReservationItem = {
  menu_name: string;
  quantity: number;
  price: number;
  discount_rate: number;
  final_price: number | null;
};

export async function POST(req: NextRequest) {
  const { store_id, reserved_time, items }: {
    store_id: string;
    reserved_time: string;
    items: ReservationItem[];
  } = await req.json();

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  if (!store_id || !reserved_time || !items || items.length === 0) {
    return NextResponse.json({ error: 'store_id, reserved_time, items are required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc('create_reservation_with_items', {
      p_user_id: user.id,
      p_store_id: store_id,
      p_reserved_time: reserved_time,
      p_items: items, // 배열 형태 [{ quantity, price, discount_rate }]
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      if (error.message.includes('Not enough quantity')) {
        return NextResponse.json({ error: '선택한 메뉴의 재고가 부족합니다.' }, { status: 409 });
      }
      return NextResponse.json({ error: '예약 생성에 실패했습니다.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation_id: data }, { status: 201 });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}



/**
 * GET /api/reservations/me
 * 로그인한 사용자의 예약 목록 반환
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const reservationService = new ReservationService(supabase);

  try {
    const reservations = await reservationService.getMyReservations();
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('API Error (getMyReservations):', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
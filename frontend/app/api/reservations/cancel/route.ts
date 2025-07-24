import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { reservation_id } = await req.json();
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  if (!reservation_id) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  try {
    // 2. 해당 예약을 찾아 user_id가 일치하는지 확인하고 상태 업데이트
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation_id)
      .eq('user_id', user.id) // 본인의 예약만 취소 가능하도록 보안 강화
      .select()
      .single(); // 단일 행만 업데이트되었는지 확인

    if (error) {
      // select().single() 때문에, 업데이트 대상이 없으면 에러가 발생함 (PGRST116)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '해당 예약을 찾을 수 없거나 취소할 권한이 없습니다.' }, { status: 404 });
      }
      console.error('Error cancelling reservation:', error);
      return NextResponse.json({ error: '예약 취소 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 3. (선택사항) 할인 수량 롤백 로직
    // 만약 취소 시 할인 쿠폰의 수량을 다시 복구해야 한다면,
    // 이 곳에서 reservation_items를 조회하여 discount 수량을 복원하는 로직을 추가할 수 있습니다.
    // 현재는 상태 변경만 처리합니다.

    return NextResponse.json({ success: true, cancelled_reservation: data }, { status: 200 });

  } catch (err: any) {
    console.error('API Route Error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 프론트엔드에서 보낼 예약 아이템의 타입 정의
type ReservationItem = {
  menu_id: string;
  discount_id: string | null;
  quantity: number;
};

export async function POST(req: NextRequest) {
  // 요청 본문에서 예약 정보 추출
  const { store_id, reserved_time, items }: { store_id: string; reserved_time: string; items: ReservationItem[] } = await req.json();
  
  const supabase = await createClient();

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // 필수 필드 검증
  if (!store_id || !reserved_time || !items || items.length === 0) {
    return NextResponse.json({ error: 'store_id, reserved_time, items are required.' }, { status: 400 });
  }

  try {
    // Supabase 데이터베이스에 생성한 RPC(Remote Procedure Call) 함수 호출
    const { data, error } = await supabase.rpc('create_reservation_with_items', {
      p_user_id: user.id,
      p_store_id: store_id,
      p_reserved_time: reserved_time,
      p_items: items, // 배열 형태의 아이템 직접 전달
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      // 데이터베이스 함수에서 발생한 특정 오류 메시지 처리 (예: 재고 부족)
      if (error.message.includes('Not enough quantity')) {
        return NextResponse.json({ error: '선택한 메뉴의 재고가 부족합니다.' }, { status: 409 });
      }
      return NextResponse.json({ error: '예약 생성에 실패했습니다.', details: error.message }, { status: 500 });
    }

    // 성공 시, 생성된 예약 ID와 함께 201 Created 상태 코드 반환
    return NextResponse.json({ success: true, reservation_id: data }, { status: 201 });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}

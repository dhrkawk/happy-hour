// frontend/app/api/stores/[id]/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReservationService } from '@/lib/services/reservations/reservation.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const storeId = (await context.params).id;

  if (!storeId) {
    return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const reservationService = new ReservationService(supabase);

    const reservations = await reservationService.getReservationsByStoreId(storeId);

    return NextResponse.json(reservations);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('API Error fetching store reservations:', error);
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

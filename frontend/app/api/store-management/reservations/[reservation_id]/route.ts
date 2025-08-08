import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservations/reservation.service';
import { createReservationDetailOwnerViewModel } from '@/lib/viewmodels/reservation-detail-owner.viewmodel';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: { id: string, reservation_id: string } }) {
  const { reservation_id: reservationId } = await context.params;
  const storeId = request.nextUrl.searchParams.get('storeId');

  if (!storeId || !reservationId) {
    return NextResponse.json({ error: 'Store ID and Reservation ID are required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const reservationService = new ReservationService(supabase);

    const reservation = await reservationService.getReservationByIdForOwner(reservationId, storeId);
    const viewModel = createReservationDetailOwnerViewModel(reservation);

    return NextResponse.json(viewModel);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    if (errorMessage.includes('Failed to fetch reservation for owner')) {
      return NextResponse.json({ error: 'Reservation not found or you do not have permission to view it.' }, { status: 404 });
    }
    if (errorMessage.includes('Unauthorized: User is not the owner of this store.')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

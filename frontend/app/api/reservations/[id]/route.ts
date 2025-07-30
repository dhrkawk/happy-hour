// frontend/app/api/reservations/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation.service';
import { createReservationDetailViewModel } from '@/lib/viewmodels/reservation-detail.viewmodel';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const reservationId = params.id;

  if (!reservationId) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const reservationService = new ReservationService(supabase);

    const reservation = await reservationService.getReservationById(reservationId);
    const viewModel = createReservationDetailViewModel(reservation);

    return NextResponse.json(viewModel);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    if (errorMessage.includes('Failed to fetch reservation')) {
      return NextResponse.json({ error: 'Reservation not found or you do not have permission to view it.' }, { status: 404 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

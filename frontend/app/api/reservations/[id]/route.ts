// frontend/app/api/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation.service';
import { createReservationDetailViewModel } from '@/lib/viewmodels/reservation-detail.viewmodel';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id: reservationId } = await context.params;

  if (!reservationId) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
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

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const { id: reservationId } = await context.params;

  if (!reservationId) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const reservationService = new ReservationService(supabase);

    const updatedReservation = await reservationService.cancelReservation(reservationId);
    return NextResponse.json({ success: true, reservation: updatedReservation });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
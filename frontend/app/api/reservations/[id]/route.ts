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

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reservationId = params.id;

  const { data, error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)
    .eq('user_id', session.user.id); // Ensure users can only delete their own reservations

  if (error) {
    console.error('Reservation cancellation failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}

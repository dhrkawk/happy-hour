
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReservationService } from '@/lib/services/reservations/reservation.service';

// GET a single reservation by ID
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const params = await context.params; // Await params
  const reservationId = params.id;

  try {
    const supabase = await createClient();
    const reservationService = new ReservationService(supabase);
    
    // The service method should handle user authentication to ensure a user can only fetch their own reservation
    const reservation = await reservationService.getReservationById(reservationId);
    
    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const body = await request.json();
  const reservationId = context.params.id;
  const status = body.status;

  if (status !== 'cancelled') {
    return NextResponse.json({ error: 'This endpoint only supports cancellation.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const reservationService = new ReservationService(supabase);
    
    // The service method handles user authentication and authorization
    await reservationService.cancelReservation(reservationId, status);
    
    return NextResponse.json({ success: true, message: 'Reservation cancelled successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

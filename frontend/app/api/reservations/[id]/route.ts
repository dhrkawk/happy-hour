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

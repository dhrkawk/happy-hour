import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { cartItems, storeId } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const userId = user.id;

  try {
    for (const item of cartItems) {
      // Find the discount_id for the current menu item and store
      const { data: discountData, error: discountError } = await supabase
        .from('discounts')
        .select('id, quantity')
        .eq('store_id', storeId)
        .eq('menu_id', item.id) // item.id is actually menu_id
        .single();

      if (discountError || !discountData) {
        console.error(`Error finding discount for menu_id ${item.id}:`, discountError);
        throw new Error(`Discount not found for menu item ${item.name}`);
      }

      if (discountData.quantity !== null && discountData.quantity < item.quantity) {
        throw new Error(`Not enough quantity for ${item.name}. Available: ${discountData.quantity}`);
      }

      // Insert into reservations table
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          discount_id: discountData.id,
          reserved_at: new Date().toISOString(),
          status: 'active',
        });

      if (reservationError) {
        console.error("Supabase reservation insert error:", reservationError);
        throw new Error("Failed to create reservation.");
      }

      // Decrement discount quantity if applicable
      if (discountData.quantity !== null) {
        const { error: updateError } = await supabase
          .from('discounts')
          .update({ quantity: discountData.quantity - item.quantity })
          .eq('id', discountData.id);

        if (updateError) {
          console.error("Supabase discount quantity update error:", updateError);
          // Consider rolling back reservation if quantity update fails
          throw new Error("Failed to update discount quantity.");
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


import { BookingCardViewModel, createBookingCardViewModel } from "@/lib/viewmodels/reservation-card.viewmodel";
import { ReservationEntity } from "@/lib/entities/reservation.entity";
import { Cart } from "@/contexts/app-context";
import { ReservationDetailViewModel, createReservationDetailViewModel } from "@/lib/viewmodels/reservation-detail.viewmodel";
import { GiftSelection } from "@/contexts/gift-context";

export class ReservationApiClient {
  private baseUrl: string = '/api/reservations';

  async getMyReservations(): Promise<BookingCardViewModel[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch reservations');
    }
    const reservationEntities: ReservationEntity[] = await response.json();
    
    const viewModels = reservationEntities.map(createBookingCardViewModel);
    return viewModels;
  }

  async getReservationById(reservationId: string): Promise<ReservationDetailViewModel> {
    const url = `${this.baseUrl}/${reservationId}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch reservation details');
    }
    const entity: ReservationEntity = await response.json();
    return createReservationDetailViewModel(entity);
  }

  async registerReservation(cart: Cart, gifts: GiftSelection[] = []): Promise<{ reservation_id: string }> {
    const cartItems = cart.items.map(item => ({
      menu_name: item.name,
      quantity: item.quantity,
      price: item.originalPrice,
      discount_rate: item.discountRate,
      final_price: item.price, // Use item.price which is the discounted price
      is_free: false,
    }));

    const giftItems = gifts.map(g => ({
      menu_name: g.menu.name,
      quantity: 1,
      price: g.menu.originalPrice,
      discount_rate: 100,
      final_price: 0, // Gifts are free
      is_free: true,
    }));

    const body = {
      store_id: cart.storeId,
      reserved_time: new Date().toISOString(),
      items: [...cartItems, ...giftItems],
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to create reservation');
    }
    return responseData;
  }

  async cancelReservation(reservationId: string): Promise<void> {
    const url = `${this.baseUrl}/${reservationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel reservation');
    }
  }
}


import { BookingCardViewModel, createBookingCardViewModel } from "@/lib/viewmodels/reservation-card.viewmodel";
import { ReservationEntity } from "@/lib/entities/reservation.entity";
import { Cart } from "@/contexts/app-context";
import { ReservationDetailViewModel, createReservationDetailViewModel } from "@/lib/viewmodels/reservation-detail.viewmodel";

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

  async registerReservation(cart: Cart): Promise<{ reservation_id: string }> {
    const body = {
      store_id: cart.storeId,
      reserved_time: new Date().toISOString(), // Set current time as reservation time
      items: cart.items.map(item => ({
        menu_name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount_rate: item.discountRate,
      })),
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

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { EventEntity } from '@/lib/entities/events/event.entity';
import { EventFormViewModel } from '@/lib/viewmodels/events/event-form.viewmodel';

const mapRawToEventEntity = (raw: any): EventEntity => {
    return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        start_date: raw.start_date,
        end_date: raw.end_date,
        happyhour_start_time: raw.happyhour_start_time,
        happyhour_end_time: raw.happyhour_end_time,
        is_active: raw.is_active,
        store_id: raw.store_id,
        weekdays: raw.weekdays,
        max_discount_rate: raw.max_discount_rate,
        max_original_price: raw.max_original_price,
        max_final_price: raw.max_final_price,
    };
};

export class EventService {
    private supabase: SupabaseClient<Database>;

    constructor(supabaseClient: SupabaseClient<Database>) {
        this.supabase = supabaseClient;
    }

    // store_id로 이벤트 조회
    async getEventsByStoreId(storeId: string): Promise<EventEntity[]> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('store_id', storeId);

        if (error) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }

        return data.map(mapRawToEventEntity);
    }

    // event_id로 이벤트 조회
    async getEventById(eventId: string): Promise<EventEntity | null> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No rows found
            throw new Error(`Failed to fetch event: ${error.message}`);
        }
        return mapRawToEventEntity(data);
    }

    // event 생성
    async insertEventAndRelated(payload: EventFormViewModel) {
        const { error } = await this.supabase.rpc('insert_event_and_related', {
            event_data: payload.eventData,
            discounts: payload.discounts,
            gifts: payload.gifts,
        });

        if (error) {
            throw new Error(`Failed to insert event: ${error.message}`);
        }
    }

    // TODO: event 업데이트
    // async updateEvent(eventId: string, eventData: Partial<EventFormViewModel>): Promise<EventEntity> {
    //     const { data, error } = await this.supabase
    //         .from('events')
    //         .update(eventData)
    //         .eq('id', eventId)
    //         .select()
    //         .single();

    //     if (error) throw new Error(`Failed to update event: ${error.message}`);
    //     return data as EventEntity;
    // }

    // TODO: event 삭제
    // async deleteEvent(eventId: string): Promise<void> {
    //     const { error } = await this.supabase
    //         .from('events')
    //         .delete()
    //         .eq('id', eventId);

    //     if (error) throw new Error(`Failed to delete event: ${error.message}`);
    // }
}

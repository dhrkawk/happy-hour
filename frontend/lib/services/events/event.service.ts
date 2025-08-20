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
            .eq('store_id', storeId)
            .order('start_date', { ascending: true });

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
    async registerEvent(payload: EventFormViewModel) {
        const formattedEventData = {
            ...payload.eventData,
            weekdays: payload.eventData.weekdays.join(',') as any, // 핵심 변경
        }
        console.log("Formatted event data:", payload);

        const { error } = await this.supabase.rpc('insert_event_and_related', {
            event_data: formattedEventData,
            discounts: payload.discounts,
            gifts: payload.gifts,
        });

        if (error) {
            console.error("Error details:", error);
            throw new Error(`Failed to insert event: insert_event_and_related() failed: ${error.message}`);
        }
    }

    // event soft delete
    async deleteEvent(eventId: string) {
        const { error } = await this.supabase.rpc('deactivate_event_and_related', {
            p_event_id: eventId,
        });

        if (error) {
        console.error('이벤트 비활성화 실패:', error);
        } else {
        console.log('이벤트와 관련된 데이터 비활성화 완료');
        }
    }
}

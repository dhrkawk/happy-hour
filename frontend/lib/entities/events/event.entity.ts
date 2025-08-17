enum weekdays {
    MONDAY = "mon",
    TUESDAY = "tue",
    WEDNESDAY = "wed",
    THURSDAY = "thu",
    FRIDAY = "fri",
    SATURDAY = "sat",
    SUNDAY = "sun"
}

export interface EventEntity {
    id: string;
    store_id: string;   
    title: string;
    start_date: Date;
    end_date: Date;
    happyhour_start_time: string;
    happyhour_end_time: string;
    weekdays: weekdays[];
    is_active: boolean;
    description: string;
    max_discount_rate: number;
    max_original_price: number;
    max_final_price: number;
}
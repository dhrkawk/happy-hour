export interface StoreEntity {
	id: string
	name: string
	address: string	
	lat: number
	lng: number
	phone: string
	category: string
	activated: boolean
	storeThumbnail: string
	ownerId: string
	
	// 아래는 entity 단계에서 가져오기 -> 다른 정보들을 가져와야하기 때문
	maxDiscountRate: number | null
    maxPrice: number | null
	maxDiscountEndTime: string | null
	discountCount: number
}


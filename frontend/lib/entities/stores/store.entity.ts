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
	partnership: string | null
  
	// 집계 필드
	maxDiscountRate: number | null
	maxPrice: number | null
	maxDiscountEndTime: string | null
	discountCount: number
  
	// 지금 활성 증정 존재 여부
	hasActiveGift: boolean
  }
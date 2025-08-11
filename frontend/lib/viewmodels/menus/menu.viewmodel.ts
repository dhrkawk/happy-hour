export interface MenuFormViewModel {
  name: string;
  price: number;
  category: string;
}

export interface MenuListItemViewModel {
  id: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  category: string;
  discountCount: number; // 할인 개수 속성 추가
}

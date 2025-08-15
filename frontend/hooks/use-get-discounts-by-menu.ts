import useSWR from 'swr';
import { DiscountApiClient } from '@/lib/services/discounts/discount.api-client';
import { DiscountDetailViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

const fetcher = async ([storeId, menuId]: [string, string]): Promise<DiscountDetailViewModel[]> => {
  return DiscountApiClient.getDiscountsByMenuId(storeId, menuId);
};

export function useGetDiscountsByMenu(storeId: string, menuId: string) {
  const { data, error, isLoading, mutate } = useSWR<DiscountDetailViewModel[]>(
    [storeId, menuId], // key
    fetcher
  );

  return {
    discounts: data || [],
    isLoading,
    error,
    mutate, // To re-fetch data
  };
}

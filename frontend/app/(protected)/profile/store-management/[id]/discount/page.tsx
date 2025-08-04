import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { MenuApiClient } from '@/lib/services/menus/menu.api-client';
import { MenuListItemViewModel } from '@/lib/viewmodels/menus/menu.viewmodel';
import { Button } from "@/components/ui/button";

interface DiscountPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountPage({ params }: DiscountPageProps) {
  const storeId = params.id;
  if (!storeId) notFound();

  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const origin = `${proto}://${host}`;

  const menuApiClient = new MenuApiClient(storeId, origin);
  let menus: MenuListItemViewModel[] = [];
  let error: string | null = null;

  try {
    menus = await menuApiClient.getMenus();
  } catch (err: any) {
    console.error('Error fetching menus:', err);
    error = err.message;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-teal-600 text-center">메뉴별 할인 관리</h1>

      {error ? (
        <div className="text-center text-red-500 font-medium">{error}</div>
      ) : menus.length === 0 ? (
        <div className="text-center text-gray-500">등록된 메뉴가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{menu.name}</h2>
                <p className="text-sm text-gray-500">{menu.price.toLocaleString()}원</p>
              </div>
              <Link href={`/profile/store-management/${storeId}/discount/${menu.id}`}>
                <Button variant="outline" size="sm" className="text-sm">
                  할인 관리
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
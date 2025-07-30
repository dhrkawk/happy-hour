import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers'; // headers import 추가
import { MenuApiClient } from '@/lib/services/menus/menu.api-client';
import { MenuListItemViewModel } from '@/lib/viewmodels/menus/menu.viewmodel';

interface DiscountPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountPage({ params }: DiscountPageProps) {
  const storeId = params.id;
  console.log('Current Store ID:', storeId);

  if (!storeId) {
    notFound();
  }

  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const origin = `${proto}://${host}`;

  const menuApiClient = new MenuApiClient(storeId, origin); // origin 전달
  let menus: MenuListItemViewModel[] = [];
  let error: string | null = null;

  try {
    menus = await menuApiClient.getMenus();
    console.log('Fetched Menus:', menus);
  } catch (err: any) {
    console.error('Error fetching menus:', err);
    error = err.message;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">메뉴별 할인 관리: {storeId}</h1>
      {error ? (
        <p className="text-red-500">오류 발생: {error}</p>
      ) : menus.length === 0 ? (
        <p>등록된 메뉴가 없습니다.</p>
      ) : (
        <ul>
          {menus.map((menu: MenuListItemViewModel) => (
            <li key={menu.id} className="border p-4 mb-2 rounded-md flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{menu.name}</h2>
                <p>가격: {menu.price}원</p>
              </div>
              <Link href={`/profile/store-management/${storeId}/discount/manage/${menu.id}`}>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  할인 관리
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { MenuApiClient } from '@/lib/services/menus/menu.api-client';
import { StoreService } from '@/lib/services/stores/store.service';
import { MenuListItemViewModel } from '@/lib/viewmodels/menus/menu.viewmodel';
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/server';

interface DiscountPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountPage({ params }: DiscountPageProps) {
  const storeId = (await params).id;
  if (!storeId) notFound();

  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const origin = `${proto}://${host}`;

  const menuApiClient = new MenuApiClient(storeId, origin);
  const storeService = new StoreService(await createClient());

  let menus: MenuListItemViewModel[] = [];
  let storeCategories: string[] = [];
  let error: string | null = null;

  try {
    const [menusData, categoriesData] = await Promise.all([
      menuApiClient.getMenus(),
      storeService.getStoreMenuCategories(storeId),
    ]);
    menus = menusData;
    storeCategories = categoriesData || [];

    // Group menus by category
    const groupedMenus: Record<string, MenuListItemViewModel[]> = {};
    (storeCategories || []).forEach(cat => {
      groupedMenus[cat] = [];
    });
    groupedMenus["기타"] = []; // Default category for uncategorized menus

    menus.forEach(menu => {
      if (menu.category && groupedMenus[menu.category]) {
        groupedMenus[menu.category].push(menu);
      } else {
        groupedMenus["기타"].push(menu);
      }
    });

    // Flatten grouped menus for display, maintaining category order
    const sortedMenus: MenuListItemViewModel[] = [];
    (storeCategories || []).forEach(cat => {
      sortedMenus.push(...groupedMenus[cat]);
    });
    sortedMenus.push(...groupedMenus["기타"]); // Add uncategorized menus at the end

    menus = sortedMenus;

  } catch (err: any) {
    console.error('Error fetching menus or categories:', err);
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
          {storeCategories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-700 mt-4">{category}</h3>
              {menus.filter(menu => menu.category === category).length === 0 && (
                <p className="text-gray-500 text-sm">이 카테고리에 메뉴가 없습니다.</p>
              )}
              {menus.filter(menu => menu.category === category).map((menu) => (
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
          ))}
          {/* Render "기타" category if it has menus */}
          {menus.filter(menu => menu.category === "기타").length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-700 mt-4">기타</h3>
              {menus.filter(menu => menu.category === "기타").map((menu) => (
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
      )}
    </div>
  );
}
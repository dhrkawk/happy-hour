"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MenuApiClient } from "@/lib/services/menus/menu.api-client";
import { MenuFormViewModel, MenuListItemViewModel } from "@/lib/viewmodels/menus/menu.viewmodel";

export default function ManageMenusPage() {
  const router = useRouter();
  const { id: storeId } = useParams() as { id: string };
  const menuApiClient = new MenuApiClient(storeId);

  const [menus, setMenus] = useState<MenuListItemViewModel[]>([]);
  const [form, setForm] = useState<MenuFormViewModel>({ name: "", price: 0, category: "기타" });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<MenuListItemViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (menuId: string) => {
    if (!confirm("정말로 이 메뉴를 삭제하시겠습니까?")) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      await menuApiClient.deleteMenu(menuId);
      await loadMenus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = await menuApiClient.getMenus();
      setMenus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const openCreateDialog = () => {
    setForm({ name: "", price: 0, category: "기타" });
    setThumbnail(null);
    setIsNew(true);
    setSelectedMenu(null);
    setDialogOpen(true);
  };

  const openEditDialog = (menu: MenuListItemViewModel) => {
    setForm({ name: menu.name, price: menu.price, category: menu.category });
    setSelectedMenu(menu);
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "price" ? Number(value) : value });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isNew) {
        await menuApiClient.registerMenu(form, thumbnail);
      } else if (selectedMenu) {
        await menuApiClient.updateMenu(selectedMenu.id, form, thumbnail);
      }
      await loadMenus();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <h2 className="text-2xl font-bold text-teal-600">메뉴 관리</h2>
        <Button onClick={openCreateDialog}>+ 새 메뉴 등록</Button>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {menus.map((menu) => (
          <Card key={menu.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
                <img
                  src={menu.thumbnailUrl}
                  alt={menu.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{menu.name}</p>
                <p className="text-sm text-gray-500">{menu.price.toLocaleString()}원</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openEditDialog(menu)}>수정</Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(menu.id)}
              >
                삭제
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isNew ? "메뉴 등록" : "메뉴 수정"}</DialogTitle>
            <CardDescription>{isNew ? "새로운 메뉴 정보를 입력하세요." : "메뉴 정보를 수정합니다."}</CardDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="thumbnail">메뉴 이미지</Label>
              <div className="flex items-center gap-2">
                <Input id="thumbnail" name="thumbnail" type="file" onChange={handleThumbnailChange} className="hidden" />
                <Button type="button" onClick={() => document.getElementById("thumbnail")?.click()} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                  파일 선택
                </Button>
                {thumbnail && <span className="text-sm text-gray-600">{thumbnail.name}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">메뉴명</Label>
              <Input id="name" name="name" placeholder="예: 소금빵" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">메뉴 가격</Label>
              <Input id="price" name="price" type="number" placeholder="예: 3500" value={form.price} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">메뉴 카테고리</Label>
              <Input id="category" name="category" placeholder="예: 음료, 식사, 기타" value={form.category} onChange={handleChange} required />
            </div>
            {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
            <DialogFooter className="flex justify-end pt-4">
              <Button type="submit" className="bg-teal-600 text-white">
                {loading ? "처리 중..." : isNew ? "등록 완료" : "수정 저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

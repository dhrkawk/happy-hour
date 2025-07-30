"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface MenuForm {
  name: string;
  price: string;
  description: string;
  thumbnail: File | null;
}

export default function MenuManagementPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const [menuCount, setMenuCount] = useState(1);
  const [forms, setForms] = useState<MenuForm[]>(
    Array.from({ length: menuCount }, () => ({
      name: "",
      price: "",
      description: "",
      thumbnail: null,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMenuCountChange = (newCount: number) => {
    if (newCount >= 1 && newCount <= 20) {
      setMenuCount(newCount);
      const newForms = Array.from({ length: newCount }, (_, i) =>
        forms[i] || { name: "", price: "", description: "", thumbnail: null }
      );
      setForms(newForms);
    }
  };

  const handleFormChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newForms = [...forms];
    newForms[index] = { ...newForms[index], [e.target.name]: e.target.value };
    setForms(newForms);
  };

  const handleThumbnailChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const newForms = [...forms];
      newForms[index] = { ...newForms[index], thumbnail: e.target.files[0] };
      setForms(newForms);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      for (const form of forms) {
        const formData = new FormData();
        formData.append("store_id", storeId);
        formData.append("name", form.name);
        formData.append("price", form.price);
        formData.append("description", form.description);
        if (form.thumbnail) {
          formData.append("thumbnail", form.thumbnail);
        }

        const res = await fetch("/api/protected/menus", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `메뉴 등록에 실패했습니다: ${form.name}`);
        }
      }
      router.push(`/profile/store-management/${storeId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-teal-600">
              메뉴 등록
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              등록할 메뉴의 개수를 선택하고 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMenuCountChange(menuCount - 1)}
                disabled={menuCount <= 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xl font-semibold">{menuCount}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMenuCountChange(menuCount + 1)}
                disabled={menuCount >= 20}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              {forms.map((form, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <h3 className="text-lg font-semibold">메뉴 {index + 1}</h3>
                  <div className="space-y-2">
                    <Label htmlFor={`thumbnail-${index}`}>메뉴 이미지</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`thumbnail-${index}`}
                        name="thumbnail"
                        type="file"
                        onChange={(e) => handleThumbnailChange(index, e)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() =>
                          document.getElementById(`thumbnail-${index}`)?.click()
                        }
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        파일 선택
                      </Button>
                      {form.thumbnail && (
                        <span className="text-sm text-gray-600">
                          {form.thumbnail.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>메뉴명</Label>
                    <Input
                      id={`name-${index}`}
                      name="name"
                      placeholder="예: 소금빵"
                      value={form.name}
                      onChange={(e) => handleFormChange(index, e)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${index}`}>메뉴 가격</Label>
                    <Input
                      id={`price-${index}`}
                      name="price"
                      type="number"
                      placeholder="예: 3500"
                      value={form.price}
                      onChange={(e) => handleFormChange(index, e)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>메뉴 설명</Label>
                    <Textarea
                      id={`description-${index}`}
                      name="description"
                      placeholder="메뉴에 대한 설명을 입력하세요."
                      value={form.description}
                      onChange={(e) => handleFormChange(index, e)}
                    />
                  </div>
                </div>
              ))}
              {error && (
                <div className="text-red-500 text-sm font-medium text-center">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? "등록 중..." : "등록 완료"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

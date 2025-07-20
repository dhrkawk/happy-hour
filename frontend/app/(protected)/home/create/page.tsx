"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CreateStorePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    menu_name: "",
    menu_price: "",
    discount_rate: "",
    start_time: "",
    end_time: "",
    quantity: "",
  });
  const [menuThumbnail, setMenuThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMenuThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMenuThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("address", form.address);
    formData.append("menu_name", form.menu_name);
    formData.append("menu_price", form.menu_price);
    formData.append("discount_rate", form.discount_rate);
    formData.append("start_time", form.start_time);
    formData.append("end_time", form.end_time);
    formData.append("quantity", form.quantity);
    if (menuThumbnail) {
      formData.append("menu_thumbnail", menuThumbnail);
    }

    try {
      const res = await fetch("/api/stores-discounts", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "등록에 실패했습니다.");
      }
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded shadow space-y-4">
        <h1 className="text-2xl font-bold text-teal-600 mb-4 text-center">가게 및 할인 등록</h1>
        <input name="name" placeholder="가게명" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="category" placeholder="카테고리" value={form.category} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="address" placeholder="주소" value={form.address} onChange={handleChange} required className="w-full border p-2 rounded" />
        <hr />
        <input name="menu_name" placeholder="메뉴명" value={form.menu_name} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="menu_price" type="number" placeholder="메뉴 가격" value={form.menu_price} onChange={handleChange} required className="w-full border p-2 rounded" />
        <label className="block text-gray-600 text-sm">메뉴 이미지</label>
        <input name="menu_thumbnail" type="file" onChange={handleMenuThumbnailChange} className="w-full border p-2 rounded" />
        <hr />
        <input name="discount_rate" type="number" placeholder="할인율(%)" value={form.discount_rate} onChange={handleChange} required className="w-full border p-2 rounded" />
        <label className="block text-gray-600 text-sm">할인 시작일시</label>
        <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required className="w-full border p-2 rounded" />
        <label className="block text-gray-600 text-sm">할인 종료일시</label>
        <input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="quantity" type="number" placeholder="할인 수량(선택)" value={form.quantity} onChange={handleChange} className="w-full border p-2 rounded" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={loading}>
          {loading ? "등록 중..." : "등록 완료"}
        </Button>
      </form>
    </div>
  );
}
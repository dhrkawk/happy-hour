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
    thumbnail: "",
    discount: "",
    original_price: "",
    discount_price: "",
    start_at: "",
    end_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          address: form.address,
          // thumbnail은 discounts에만 저장
          discount: Number(form.discount),
          original_price: Number(form.original_price),
          discount_price: Number(form.discount_price),
          start_at: form.start_at,
          end_at: form.end_at,
          thumbnail: form.thumbnail,
        }),
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
        <h1 className="text-2xl font-bold text-teal-600 mb-4 text-center">가게 등록</h1>
        <input name="name" placeholder="가게명" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="category" placeholder="카테고리" value={form.category} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="address" placeholder="주소" value={form.address} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="thumbnail" placeholder="썸네일 이미지 URL" value={form.thumbnail} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="discount" type="number" placeholder="할인율(%)" value={form.discount} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="original_price" type="number" placeholder="원래 가격" value={form.original_price} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="discount_price" type="number" placeholder="할인가" value={form.discount_price} onChange={handleChange} required className="w-full border p-2 rounded" />
        <label className="block text-gray-600 text-sm">할인 시작일</label>
        <input name="start_at" type="date" value={form.start_at} onChange={handleChange} required className="w-full border p-2 rounded" />
        <label className="block text-gray-600 text-sm">할인 종료일</label>
        <input name="end_at" type="date" value={form.end_at} onChange={handleChange} required className="w-full border p-2 rounded" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={loading}>
          {loading ? "등록 중..." : "등록 완료"}
        </Button>
      </form>
    </div>
  );
} 
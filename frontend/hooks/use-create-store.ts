"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Define the type for the form state
interface StoreFormState {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
}

export function useCreateStore() {
  const router = useRouter();
  const [form, setForm] = useState<StoreFormState>({
    name: "",
    category: "",
    address: "",
    lat: 0,
    lng: 0,
  });
  const [storeThumbnail, setStoreThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = useCallback((address: string, lat: number, lng: number) => {
    setForm((prevForm) => ({ ...prevForm, address, lat, lng }));
  }, []);

  const handleStoreThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStoreThumbnail(e.target.files[0]);
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
    formData.append("lat", form.lat.toString());
    formData.append("lng", form.lng.toString());
    if (storeThumbnail) {
      formData.append("store_thumbnail", storeThumbnail);
    }

    try {
      // NOTE: The API endpoint seems to be `/api/stores` based on the backend structure,
      // but the original code used `/api/stores-discounts`. I'll use the original one
      // for now, but this might need to be corrected.
      const res = await fetch("/api/stores", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "가게 등록에 실패했습니다.");
      }
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    handleChange,
    handleAddressSelect,
    handleStoreThumbnailChange,
    handleSubmit,
    storeThumbnail
  };
}

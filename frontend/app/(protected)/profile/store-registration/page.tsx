'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import AddressSearchMap from '@/components/map/address-search-map';

import {
  storeFormBaseSchema as storeFormSchema,
  type StoreForm,
} from '@/app/(protected)/profile/store-registration/store.form';

import { useCreateStore } from '@/hooks/use-create-store';

export default function StoreRegistrationPage() {
  const router = useRouter();

  const form = useForm<StoreForm>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 37.5665,
      lng: 126.9780,
      phone: '',
      category: '',
      storeThumbnail: '',
      menuCategory: [],
      partnership: null,
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const createStore = useCreateStore({
    onSuccess: (id) => router.push(`/profile/store-management/${id}`),
  });

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    form.setValue('address', address, { shouldValidate: true });
    form.setValue('lat', lat, { shouldValidate: true });
    form.setValue('lng', lng, { shouldValidate: true });
  };

  const handleStoreThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const onSubmit = (data: StoreForm) => {
    createStore.mutate({ form: data, file });
  };

  const submitting = createStore.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-teal-600">
              나의 가게 등록하기
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              가게 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 1행: 이름/카테고리 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">가게명</Label>
                  <Input
                    id="name"
                    placeholder="예: 행복한 베이커리"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Input
                    id="category"
                    placeholder="예: 베이커리"
                    {...form.register('category')}
                  />
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* 2행: 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  placeholder="예: 02-1234-5678 또는 010-1234-5678"
                  inputMode="tel"
                  autoComplete="tel"
                  {...form.register('phone')}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* 주소 + 지도 */}
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <AddressSearchMap onAddressSelect={handleAddressSelect} />
                <Input
                  id="address"
                  placeholder="지도에서 주소를 검색하거나 클릭하세요."
                  readOnly
                  {...form.register('address')}
                />
                <input type="hidden" {...form.register('lat', { valueAsNumber: true })} />
                <input type="hidden" {...form.register('lng', { valueAsNumber: true })} />
                {(form.formState.errors.address || form.formState.errors.lat || form.formState.errors.lng) && (
                  <p className="text-sm text-red-500">주소/좌표를 확인해주세요.</p>
                )}
              </div>

              {/* 썸네일 업로드 */}
              <div className="space-y-2">
                <Label htmlFor="store_thumbnail">가게 이미지</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="store_thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleStoreThumbnailChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    파일 선택
                  </Button>
                  {file && <span className="text-sm text-gray-600">{file.name}</span>}
                </div>

                {/* URL 직접 입력을 허용하려면 열기 */}
                {/* <Input placeholder="이미지 URL" {...form.register('storeThumbnail')} /> */}

                {form.formState.errors.storeThumbnail && (
                  <p className="text-sm text-red-500">{form.formState.errors.storeThumbnail.message}</p>
                )}
              </div>

              {/* 서버/훅 에러 */}
              {createStore.isError && (
                <div className="text-red-500 text-sm font-medium text-center">
                  {(createStore.error as Error)?.message ?? '생성에 실패했습니다.'}
                </div>
              )}

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    등록 중...
                  </div>
                ) : (
                  '등록 완료'
                )}
              </Button>

              {/* 디버깅용: 폼 에러 출력 */}
              {Object.keys(form.formState.errors).length > 0 && (
                <pre className="text-xs text-red-500 mt-2">
                  {JSON.stringify(form.formState.errors, null, 2)}
                </pre>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
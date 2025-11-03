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

import { useAppContext } from '@/contexts/app-context';
import { useCreateStore } from '@/hooks/usecases/stores.usecase';
import { uploadStoreThumbnail } from '@/hooks/usecases/stores.usecase'; // 제공한 함수 사용
import { StoreInsertDTO, StoreInsertSchema } from '@/domain/schemas/schemas';

export default function StoreRegistrationPage() {
  const router = useRouter();
  const { appState } = useAppContext();
  const { user } = appState;

  const createStore = useCreateStore();

  const form = useForm<StoreInsertDTO>({
    resolver: zodResolver(StoreInsertSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 37.5665,
      lng: 126.9780,
      phone: '',
      category: '',
      store_thumbnail: null, // 업로드 후 채움
      menu_category: [],
      partnership: null,
      is_active: true,
      owner_id: user.profile?.userId,
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    form.setValue('address', address, { shouldValidate: true });
    form.setValue('lat', lat, { shouldValidate: true });
    form.setValue('lng', lng, { shouldValidate: true });
  };

  const handleStoreThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileError(f ? null : '가게 이미지를 선택해주세요.');
  };

  const onSubmit = async (data: StoreInsertDTO) => {
    // 0) 인증 검사
    if (!user.isAuthenticated || !user.profile?.userId) {
      form.setError('name', { type: 'manual', message: '로그인이 필요합니다.' });
      return;
    }
    // 1) 파일 필수 검사
    if (!file) {
      setFileError('가게 이미지는 필수입니다. 이미지를 선택해주세요.');
      return;
    }

    try {
      // 3) 썸네일 업로드 먼저 수행 → public URL 획득
      const thumbnailUrl = await uploadStoreThumbnail(file);
      // 4) DTO 구성 (썸네일 URL, owner_id 포함)
      const dto: StoreInsertDTO = {
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        category: data.category,
        store_thumbnail: thumbnailUrl,
        is_active: data.is_active,
        menu_category: data.menu_category,
        partnership: data.partnership,
        owner_id: user.profile.userId,
      };

      // 5) 스토어 생성
      const res = await createStore.mutateAsync(dto);
      // 7) 이동
      router.push(`/profile/store-management/${res.id}`);
    } catch (err: any) {
      console.error(err);
      form.setError('name', { type: 'manual', message: err?.message ?? '등록에 실패했습니다.' });
    }
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
                  <Input id="name" placeholder="예: 행복한 베이커리" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Input id="category" placeholder="예: 베이커리" {...form.register('category')} />
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

              {/* 썸네일 업로드 (필수) */}
              <div className="space-y-2">
                <Label htmlFor="store_thumbnail">가게 이미지 (필수)</Label>
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
                {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              </div>

              {/* 서버/훅 에러 */}
              {createStore.isError && (
                <div className="text-red-500 text-sm font-medium text-center">
                  {(createStore.error as Error)?.message ?? '생성에 실패했습니다.'}
                </div>
              )}

              {/* 제출 버튼: 파일 없으면 비활성화 */}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors"
                disabled={submitting || !file}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
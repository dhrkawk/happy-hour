import { notFound } from 'next/navigation';
import { DiscountService } from '@/lib/services/discounts/discount.service';
import { DiscountViewModel } from '@/lib/viewmodels/discounts/discount.viewmodel';

interface DiscountPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountPage({ params }: DiscountPageProps) {
  const storeId = params.id;

  if (!storeId) {
    notFound();
  }

  const discounts = await DiscountService.getDiscountsByStoreId(storeId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Discounts for Store ID: {storeId}</h1>
      {discounts.length === 0 ? (
        <p>No discounts found for this store.</p>
      ) : (
        <ul>
          {discounts.map((discount: DiscountViewModel) => (
            <li key={discount.id} className="border p-4 mb-2 rounded-md">
              <h2 className="text-xl font-semibold">{discount.name}</h2>
              <p>{discount.description}</p>
              <p>Discount Type: {discount.discountType}</p>
              <p>Value: {discount.value}</p>
              <p>Start Date: {new Date(discount.startDate).toLocaleDateString()}</p>
              <p>End Date: {new Date(discount.endDate).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
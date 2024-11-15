import { Metadata } from 'next';
import { CustomerList } from '@/components/customers/customer-list';

export const metadata: Metadata = {
  title: 'Customers & Partners',
  description: 'Manage your customers and business partners',
};

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers & Partners</h1>
        <p className="text-muted-foreground">
          Manage your business relationships and track interactions
        </p>
      </div>
      <CustomerList />
    </div>
  );
}
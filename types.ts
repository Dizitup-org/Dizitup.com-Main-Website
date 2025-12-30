
export interface SaleRecord {
  id: string;
  date: string;
  clientName: string;
  service: string;
  amount: number;
  status: 'Paid' | 'Pending';
  type: 'Retainer' | 'One-time';
}

export interface MetricCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export interface ServiceCapability {
  title: string;
  description: string;
  icon: string;
}

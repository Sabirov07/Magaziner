export interface Route {
  id: string;
  date: string;
  driver: {
    name: string;
  };
  totalAmount: number;
  deliveries: Delivery[];
  expenses: Expense[];
}

export interface Delivery {
  id: string;
  routeId: string;
  clientName: string;
  cashAmount: number;
  cardAmount: number;
  transfer: number;
  debt: number;
}

export interface Expense {
  id: string;
  routeId: string;
  amount: number;
  description: string;
} 
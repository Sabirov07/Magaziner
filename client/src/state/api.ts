import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Route } from "./types";


export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewLog {
  productId: string;
  type: string;
  value: number;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummarId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface ProductLog {
  id: string;
  productId: string;
  type: string;
  value: number;
  user: string;
  createdAt: string;
}

export interface ProductWithLogs extends Product {
  logs: ProductLog[];
}

// New interfaces for accounting features
export interface Driver {
  id: string;
  name: string;
  createdAt: string;
  dayStatuses?: DriverDayStatus[];
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  driverId: string;
  clientId: string;
  amount: number;
  cashAmount: number;
  cardAmount: number;
  transfer: number;
  debt: number;
  goodsAmount: number;
  extraPayment: number;
  isPaid: boolean;
  deliveryDate: string;
  createdAt: string;
  driver?: Driver;
  client?: Client;
}

export interface DriverExpense {
  id: string;
  driverId: string;
  type: string;
  name?: string;
  amount: number;
  expenseDate: string;
  createdAt: string;
  driver?: Driver;
}

export interface ClientDebt {
  id: string;
  clientId: string;
  amount: number;
  remainingAmount: number;
  description?: string;
  debtDate: string;
  dueDate?: string;
  type: 'DEBT' | 'PAYMENT';
  createdAt: string;
  isFromDelivery?: boolean;
}

export interface DebtPayment {
  id: string;
  clientDebtId: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export interface NewDelivery {
  driverId: string;
  clientId: string;
  amount: number;
  cashAmount: number;
  cardAmount: number;
  transfer: number;
  debt: number;
  goodsAmount: number;
  extraPayment: number;
  deliveryDate?: string;
}

export interface NewDriverExpense {
  driverId: string;
  type: string;
  amount: number;
  expenseDate?: string;
}

export interface NewClient {
  name: string;
  address?: string;
  phone?: string;
}

export interface DriverDayStatus {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  status: 'PENDING' | 'PAID_OFF' | 'PARTIALLY_PAID' | 'DISPUTED';
  totalCash: number;
  cashPaid: number;
  notes?: string;
  banknotes?: { [key: string]: number };
}

export interface DriverDailyReportData {
  driver: { 
    id: string;
    name: string;
  };
  date: string;
  deliveries: Delivery[];
  expenses: DriverExpense[];
  dayStatus?: DriverDayStatus;
  summary: {
    totalCash: number;
    totalExpenses: number;
  };
}

export interface ClientTotalDebts {
  totalDebt: number;
  transactions: ClientDebt[];
  deliveryDebts: Array<{
    id: string;
    amount: number;
    debtDate: string;
    type: 'DEBT' | 'PAYMENT';
    description: string;
    isFromDelivery: boolean;
    deliveryId: string;
  }>;
  breakdown: {
    fromRegularDebts: number;
    fromDeliveries: number;
  };
}

export interface DailyIncome {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface DailyExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: 'api',
  tagTypes: [
    'DashboardMetrics', 
    'Products', 
    'Expenses', 
    'Routes',
    'Drivers',
    'Clients',
    'Deliveries',
    'DriverExpenses',
    'ClientDebts',
    'DriverDayStatus',
    'DailyIncomes',
    'DailyExpenses',
    'Client'
  ],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => '/dashboard',
      providesTags: ['DashboardMetrics']
    }),
    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: '/products',
        params: search ? { search } : {}
      }),
      providesTags: ['Products']
    }),
    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: '/products',
        method: "POST",
        body: newProduct
      }),
      invalidatesTags: ['Products']
    }),
    getRoutes: build.query<Route[], string>({
      query: (date) => ({
        url: '/routes',
        params: date ? { date } : {},
      }),
      providesTags: ['Routes']
    }),
    createRoute: build.mutation<Route, Partial<Route>>({
      query: (route) => ({
        url: '/routes',
        method: 'POST',
        body: route
      }),
      invalidatesTags: ['Routes']
    }),
    logProduct: build.mutation<NewLog, NewLog>({
      query: (newLog) => ({
        url: '/products',
        method: "PUT",
        body: newLog
      }),
      async onQueryStarted({ productId, type, value }, { dispatch, queryFulfilled }) {
        // Get the current cache data
        const patchResult = dispatch(
          api.util.updateQueryData('getProducts', undefined, (draft) => {
            const product = draft.find(p => p.productId === productId);
            if (product) {
              if (type === 'income') {
                product.stockQuantity += value;
              } else if (type === 'outcome') {
                product.stockQuantity -= value;
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
        }
      },
      invalidatesTags: ['Products']
    }),
    getExpenseByCategory: build.query<ExpenseByCategorySummary[], void>({
      query: () => '/expenses',
      providesTags: ['Expenses']
    }),
    getProductById: build.query<ProductWithLogs, string>({
      query: (productId) => `/products/${productId}`,
      providesTags: ['Products']
    }),
    // Driver endpoints
    getDrivers: build.query<Driver[], void>({
      query: () => '/drivers',
      providesTags: ['Drivers']
    }),

    getDriverDeliveries: build.query<Delivery[], { driverId: string; date?: string }>({
      query: ({ driverId, date }) => ({
        url: `/accounting/drivers/${driverId}/deliveries`,
        params: date ? { date } : {}
      }),
      providesTags: ['Deliveries']
    }),

    getDriverExpenses: build.query<DriverExpense[], { driverId: string; date?: string }>({
      query: ({ driverId, date }) => ({
        url: `/accounting/drivers/${driverId}/expenses`,
        params: date ? { date } : {}
      }),
      providesTags: ['DriverExpenses']
    }),

    // Delivery endpoints
    getDeliveries: build.query<Delivery[], { date?: string }>({
      query: ({ date }) => ({
        url: '/accounting/deliveries',
        params: date ? { date } : {}
      }),
      providesTags: ['Deliveries']
    }),

    createDelivery: build.mutation<Delivery, NewDelivery>({
      query: (data) => ({
        url: '/accounting/deliveries',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Deliveries'],
    }),

    // Driver Expense endpoints
    createDriverExpense: build.mutation<DriverExpense, NewDriverExpense>({
      query: (expense) => ({
        url: '/accounting/driver-expenses',
        method: 'POST',
        body: expense
      }),
      invalidatesTags: ['DriverExpenses']
    }),

    // Client endpoints
    getClients: build.query<Client[], void>({
      query: () => '/clients',
      providesTags: ['Clients']
    }),

    getClientDeliveries: build.query<Delivery[], string>({
      query: (clientId) => ({
        url: `/clients/${clientId}/deliveries`,
        method: 'GET',
      }),
      providesTags: ['Deliveries'],
    }),

    getClientDebts: build.query<ClientDebt[], string>({
      query: (clientId) => `/clients/${clientId}/debts`,
      providesTags: ['ClientDebts']
    }),

    getDeliveryById: build.query<Delivery, string>({
      query: (id) => `/accounting/deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Deliveries', id }]
    }),

    updateDelivery: build.mutation<Delivery, Partial<Delivery> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/deliveries/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Deliveries']
    }),

    deleteDelivery: build.mutation<void, string>({
      query: (id) => ({
        url: `/accounting/deliveries/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Deliveries']
    }),

    createClient: build.mutation<Client, NewClient>({
      query: (newClient) => ({
        url: '/clients',
        method: 'POST',
        body: newClient,
      }),
      invalidatesTags: ['Clients'],
    }),

    updateClient: build.mutation<Client, { id: string; data: Partial<NewClient> }>({
      query: ({ id, data }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Clients', 'Deliveries', 'ClientDebts'],
    }),

    deleteClient: build.mutation<void, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Clients'],
    }),

    getDriverDayStatus: build.query<DriverDayStatus, { driverId: string; date: string }>({
      query: ({ driverId, date }) => ({
        url: '/accounting/driver-day-status',
        params: { driverId, date }
      }),
      providesTags: ['DriverDayStatus']
    }),

    updateDriverDayStatus: build.mutation<DriverDayStatus, Partial<DriverDayStatus>>({
      query: (data) => ({
        url: '/accounting/driver-day-status',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['DriverDayStatus']
    }),

    getDriverDailyReport: build.query<DriverDailyReportData, { driverId: string; date: string }>({
      query: ({ driverId, date }) => `/accounting/drivers/${driverId}/daily-report/${date}`,
      providesTags: ['Deliveries', 'DriverExpenses', 'DriverDayStatus']
    }),

    updateDriverExpense: build.mutation<DriverExpense, { 
      id: string; 
      type: string; 
      amount: number;
      driverId?: string;
      expenseDate?: string;
    }>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/driver-expenses/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['DriverExpenses']
    }),

    deleteDriverExpense: build.mutation<void, string>({
      query: (id) => ({
        url: `/accounting/driver-expenses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DriverExpenses']
    }),

    addDriver: build.mutation<Driver, { name: string; phoneNumber?: string }>({
      query: (data) => ({
        url: '/drivers',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Drivers']
    }),

    getDriver: build.query<Driver, string>({
      query: (id) => `/drivers/${id}`,
      providesTags: ['Drivers']
    }),

    createClientDebt: build.mutation<ClientDebt, { clientId: string, data: Partial<ClientDebt> }>({
      query: ({ clientId, data }) => ({
        url: `/clients/${clientId}/debts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClientDebts'],
    }),

    updateClientDebt: build.mutation<ClientDebt, { debtId: string, data: Partial<ClientDebt> }>({
      query: ({ debtId, data }) => ({
        url: `/clients/debts/${debtId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClientDebts'],
    }),

    deleteClientDebt: build.mutation<void, string>({
      query: (debtId) => ({
        url: `/clients/debts/${debtId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClientDebts'],
    }),

    getClientTotalDebts: build.query<ClientTotalDebts, string>({
      query: (clientId) => `/clients/${clientId}/total-debts`,
      providesTags: ['ClientDebts', 'Deliveries']
    }),

    getAllDriverExpenses: build.query<DriverExpense[], { date?: string }>({
      query: ({ date }) => ({
        url: '/accounting/all-driver-expenses',
        params: date ? { date } : {}
      }),
      providesTags: ['DriverExpenses']
    }),

    getDailyIncomes: build.query<DailyIncome[], { date: string; endDate?: string }>({
      query: ({ date, endDate }) => ({
        url: '/accounting/daily-incomes',
        params: { date, endDate }
      }),
      providesTags: ['DailyIncomes']
    }),

    createDailyIncome: build.mutation<DailyIncome, { date: string; amount: number; description: string }>({
      query: (data) => ({
        url: '/accounting/daily-incomes',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['DailyIncomes']
    }),

    updateDailyIncome: build.mutation<DailyIncome, { id: string } & Partial<DailyIncome>>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/daily-incomes/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['DailyIncomes']
    }),

    deleteDailyIncome: build.mutation<void, string>({
      query: (id) => ({
        url: `/accounting/daily-incomes/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DailyIncomes']
    }),

    getDailyExpenses: build.query<DailyExpense[], { date: string; endDate?: string }>({
      query: ({ date, endDate }) => ({
        url: '/accounting/daily-expenses',
        params: { date, endDate }
      }),
      providesTags: ['DailyExpenses']
    }),

    createDailyExpense: build.mutation<DailyExpense, { date: string; amount: number; description: string }>({
      query: (data) => ({
        url: '/accounting/daily-expenses',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['DailyExpenses']
    }),

    updateDailyExpense: build.mutation<DailyExpense, { id: string } & Partial<DailyExpense>>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/daily-expenses/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['DailyExpenses']
    }),

    deleteDailyExpense: build.mutation<void, string>({
      query: (id) => ({
        url: `/accounting/daily-expenses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DailyExpenses']
    }),

    getDriverDayStatuses: build.query<DriverDayStatus[], { 
      date: string; 
      endDate?: string;
      driverId: string;
      source?: string;
    }>({
      query: ({ date, endDate, driverId, source }) => ({
        url: '/accounting/driver-day-statuses',
        params: { 
          date, 
          endDate,
          driverId,
          source
        }
      }),
      providesTags: ['DriverDayStatus']
    }),

    getDriverDayTotalCash: build.query<{ totalCash: number }, string>({
      query: (date) => ({
        url: '/accounting/daily-total-cash',
        params: { date }
      }),
    }),
  })
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useLogProductMutation,
  useGetProductByIdQuery,
  useGetRoutesQuery,
  useCreateRouteMutation,
  useGetDriversQuery,
  useGetDriverQuery,
  useGetDriverDeliveriesQuery,
  useGetDriverExpensesQuery,
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useCreateDriverExpenseMutation,
  useGetClientsQuery,
  useGetClientDeliveriesQuery,
  useGetClientDebtsQuery,
  useGetDeliveryByIdQuery,
  useUpdateDeliveryMutation,
  useDeleteDeliveryMutation,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetDriverDayStatusQuery,
  useUpdateDriverDayStatusMutation,
  useGetDriverDailyReportQuery,
  useUpdateDriverExpenseMutation,
  useDeleteDriverExpenseMutation,
  useAddDriverMutation,
  useCreateClientDebtMutation,
  useUpdateClientDebtMutation,
  useDeleteClientDebtMutation,
  useGetClientTotalDebtsQuery,
  useGetAllDriverExpensesQuery,
  useGetDailyIncomesQuery,
  useCreateDailyIncomeMutation,
  useUpdateDailyIncomeMutation,
  useDeleteDailyIncomeMutation,
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetDriverDayStatusesQuery,
  useGetDriverDayTotalCashQuery,
} = api;
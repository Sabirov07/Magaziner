import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { useGetDriverDailyReportQuery } from "@/state/api";

interface DeliveryForPDF {
  client?: { name: string }; // Replace clientName with client relation
  cashAmount: number;
  cardAmount: number;
  transfer: number;
  debt: number;
  goodsAmount: number;
  extraPayment?: number;
}

interface DriverExpense {
  type: string;
  amount: number;
  name?: string;
}

interface DriverDayStatus {
  status: string;
  notes?: string;
  cashPaid?: number;
  date?: string;
  updatedAt?: string;
}

interface DriverDailyReportData {
  driver: { 
    id: string;
    name: string;
  };
  date: string;
  deliveries: DeliveryForPDF[]; // Use the new interface
  expenses: DriverExpense[];
  dayStatus?: DriverDayStatus;
  summary: {
    totalCash: number;
    totalExpenses: number;
  };
}

interface DriverDailyReportProps {
  driverId: string;
  date: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  section: {
    marginBottom: 5,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  summary: {
    marginTop: 8,
    paddingTop: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryItem: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    marginHorizontal: 5,
  },
  notesSection: {
    width: '100%',
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
  },
  accountingDate: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  driverInfo: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
});

export const DriverDailyReportWrapper = ({ driverId, date }: DriverDailyReportProps) => {
  const { data, isLoading, error } = useGetDriverDailyReportQuery({
    driverId,
    date,
  });

  if (isLoading) {
    return null; // The parent component will handle loading state
  }

  if (error || !data) {
    console.error("Error fetching PDF data:", error);
    return null;
  }

  return <DriverDailyReportPDF data={data} />;
};

export const DriverDailyReportPDF = ({
  data
}: {
  data: DriverDailyReportData;
}) => {
  if (!data || !data.driver) {
    return null;
  }

  // Ensure we have valid dates
  const reportDate = data.date ? new Date(data.date) : new Date();
  const accountingDate = data.dayStatus?.updatedAt 
    ? new Date(data.dayStatus.updatedAt)
    : new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.driverInfo}>
            Sana: {format(reportDate, "dd.MM.yyyy")}
          </Text>
          <Text style={styles.driverInfo}>
            Haydovchi: {data.driver.name}
          </Text>
          <Text style={styles.driverInfo}>
            Status: {data.dayStatus?.status === "PENDING"
              ? "Kutilmoqda"
              : data.dayStatus?.status === "PAID_OFF"
              ? "To'langan"
              : data.dayStatus?.status === "PARTIALLY_PAID"
              ? "Qisman to'langan"
              : data.dayStatus?.status === "DISPUTED"
              ? "Muammoli"
              : "Kutilmoqda"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Dastavalar</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: "25%" }]}>Mijoz</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Tovar</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Przelew</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Naqd</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Privat</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Qarz</Text>
              <Text style={[styles.tableCell, { width: "12.5%" }]}>Qarz to'lovi</Text>
            </View>
            {data.deliveries?.map((delivery, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "25%" }]}>
                  {delivery.client?.name}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.goodsAmount}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.transfer}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.cashAmount}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.cardAmount}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.debt}
                </Text>
                <Text style={[styles.tableCell, { width: "12.5%" }]}>
                  {delivery.extraPayment || 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Xarajatlar</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: "70%" }]}>Turi</Text>
              <Text style={[styles.tableCell, { width: "30%" }]}>Summa</Text>
            </View>
            {data.expenses?.map((expense, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "70%" }]}>
                  {expense.type === "BOSHQA" ? expense.name : expense.type}
                </Text>
                <Text style={[styles.tableCell, { width: "30%" }]}>
                  {expense.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text>Jami naqd: {(data.summary?.totalCash ?? 0) + (data.deliveries?.reduce((sum, del) => sum + (del.extraPayment || 0), 0) || 0)} zl</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text>Jami xarajatlar: {data.summary?.totalExpenses ?? 0} zl</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text>Qoldiq: {((data.summary?.totalCash ?? 0) + (data.deliveries?.reduce((sum, del) => sum + (del.extraPayment || 0), 0) || 0)) - (data.summary?.totalExpenses ?? 0)} zl</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text>Bergan: {data.dayStatus?.cashPaid ?? 0} zl</Text>
            </View>
          </View>

          {data.dayStatus?.notes && (
            <View style={styles.notesSection}>
              <Text>Izohlar: {data.dayStatus.notes}</Text>
            </View>
          )}
        </View>

        {/* Accounting date at the bottom */}
        <View style={styles.accountingDate}>
          <Text>
            Hisob sanasi: {format(accountingDate, "dd.MM.yyyy HH:mm")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

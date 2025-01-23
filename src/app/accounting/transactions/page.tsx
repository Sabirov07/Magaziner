// ... existing code ...
// Remove or comment out the unused import
// import { AddClientModal } from '../components/AddClientModal'

// Replace 'any' types with proper types
interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  // Add other relevant fields
}

// Update the function signatures to use the new type
const handleRowClick = (params: Transaction) => {
  // ... existing code ...
}

const handleCellClick = (params: Transaction) => {
  // ... existing code ...
}
// ... existing code ... 
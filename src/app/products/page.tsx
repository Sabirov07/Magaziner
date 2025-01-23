// Define proper type instead of any
interface Product {
  id: string;
  name: string;
  price: number;
  // Add other relevant fields
}

// Update function signature
const handleProduct = (product: Product) => {
  // ... existing code ...
}; 
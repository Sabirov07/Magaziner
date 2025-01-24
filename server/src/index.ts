import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// ROUTE IMPORTS
import dashboardRoutes from './routes/dashboardRoutes'
import productRoutes from './routes/productRoutes'
import expenseByCategoryRoutes from './routes/expensebySummaryRoutes'
import accountingRoutes from './routes/accountingRoutes'
import clientRoutes from './routes/clientRoutes';
import driverRoutes from './routes/driverRoutes';
import { getProducts } from './controllers/productController';


// Update CORS configuration
const corsOptions = {
  origin: [
    'https://master.d2ku7rh3vs4gc2.amplifyapp.com', // Your Amplify frontend URL
    'http://localhost:3000' // Local development URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// CONFIGURATIONS
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors(corsOptions)); // Use the configured CORS options


// ROUTES
app.use('/clients', clientRoutes);
app.use('/drivers', driverRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);
app.use('/expenses', expenseByCategoryRoutes)
app.use('/accounting', accountingRoutes);
// SERVER
const port = Number(process.env.PORT) || 3001;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`)
})
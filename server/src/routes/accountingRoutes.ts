import express from 'express';
import { accountingController } from '../controllers/accountingController';

const router = express.Router();

// Driver routes
router.get('/drivers/:driverId/deliveries', accountingController.getDriverDeliveries);
router.get('/drivers/:driverId/expenses', accountingController.getDriverExpenses);

// Delivery routes
router.post('/deliveries', accountingController.createDelivery);
router.get('/deliveries', accountingController.getDeliveries);
router.get('/drivers/:driverId/cash-total', accountingController.getDriverCashTotal);
router.get('/deliveries/:id', accountingController.getDeliveryById);
router.put('/deliveries/:id', accountingController.updateDelivery);
router.delete('/deliveries/:id', accountingController.deleteDelivery);

// Expense routes
router.post('/driver-expenses', accountingController.createDriverExpense);
router.put('/driver-expenses/:id', accountingController.updateDriverExpense);
router.delete('/driver-expenses/:id', accountingController.deleteDriverExpense);
// Add to existing routes
router.get('/driver-day-status', accountingController.getDriverDayStatus);
router.post('/driver-day-status', accountingController.updateDriverDayStatus);

// Add new route
router.get('/drivers/:driverId/daily-report/:date', accountingController.getDriverDailyReport);

// Add new route
router.get('/all-driver-expenses', accountingController.getAllDriverExpenses);

// Add new route
router.get('/driver-day-statuses', accountingController.getDriverDayStatuses);

// Add this new route
router.get('/daily-total-cash', accountingController.getDriverDayTotalCash);

// Daily income routes
router.get('/daily-incomes', accountingController.getDailyIncomes);
router.post('/daily-incomes', accountingController.createDailyIncome);
router.put('/daily-incomes/:id', accountingController.updateDailyIncome);
router.delete('/daily-incomes/:id', accountingController.deleteDailyIncome);

// Daily expense routes
router.get('/daily-expenses', accountingController.getDailyExpenses);
router.post('/daily-expenses', accountingController.createDailyExpense);
router.put('/daily-expenses/:id', accountingController.updateDailyExpense);
router.delete('/daily-expenses/:id', accountingController.deleteDailyExpense);

export default router;

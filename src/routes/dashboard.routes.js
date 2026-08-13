import express from 'express';
import { getDashboardKPIs } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.get('/kpi', authenticate, getDashboardKPIs);

export default router;

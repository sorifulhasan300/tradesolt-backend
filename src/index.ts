import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes.js';
import notFoundHandler from './middleware/notFound.js';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'TradeSlot Backend API Running',
  });
});

// Route Mounts
app.use('/api/v1', apiRoutes);

// Global Not Found Handler
app.use(notFoundHandler);

// Server Startup
app.listen(PORT, () => {
  console.log(`🚀 TradeSlot Backend Server running on port ${PORT}`);
});

export default app;

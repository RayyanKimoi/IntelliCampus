import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/rateLimit.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import gamificationRoutes from './routes/gamification.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// ========================
// Global Middleware
// ========================
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ========================
// Health Check
// ========================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'IntelliCampus API is running',
    timestamp: new Date().toISOString(),
  });
});

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// ========================
// 404 Handler
// ========================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ========================
// Global Error Handler
// ========================
app.use(errorHandler);

export default app;

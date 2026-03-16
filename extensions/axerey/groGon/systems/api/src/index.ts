import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'groGon-api', timestamp: new Date().toISOString() });
});

// API Routes (to be implemented)
app.get('/api/v1/products', (req, res) => {
  res.json({ success: true, data: [], message: 'Products endpoint - coming soon' });
});

app.get('/api/v1/services', (req, res) => {
  res.json({ success: true, data: [], message: 'Services endpoint - coming soon' });
});

app.post('/api/v1/contact', (req, res) => {
  res.json({ success: true, message: 'Contact form submission - coming soon' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GroGon API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


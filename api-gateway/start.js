#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { app } from './server.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

try {
  app.listen(PORT, HOST, () => {
    console.log(`✅ API Gateway running at http://${HOST}:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL || 'not configured'}`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

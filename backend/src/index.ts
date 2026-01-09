import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables (Always do this first)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';

// 2. Define the Port
const PORT = process.env.PORT || 4000;

// 3. Start the Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
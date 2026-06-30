import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const distPath = resolve(__dirname, 'dist');

// Serve static files from the Vite build output
app.use(express.static(distPath));

// SPA fallback: any route that doesn't match a static file gets index.html
app.get('*', (_req, res) => {
  res.sendFile(resolve(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FuelTrack Frontend running on port ${PORT}`);
});

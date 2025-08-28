import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve ag-grid files with proper static configuration
app.use('/ag-grid', express.static(path.join(__dirname, '../node_modules/ag-grid-community'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get church collection data
app.get('/api/church-data', (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../dist/church-data-collection.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        error: 'Church data collection file not found. Please run "grunt" in the root directory to generate the data.' 
      });
    }

    // Read and parse the JSON file
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Error reading church data:', error);
    res.status(500).json({ 
      error: 'Failed to load church collection data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main app for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Edgar Church Collection Webapp running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/church-data`);
});
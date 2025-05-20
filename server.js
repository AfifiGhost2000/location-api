const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const fs = require('fs');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());


const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});

http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(80);


// Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Security: API Key Middleware
const API_KEY = 'GPSAPP@123@'; // change this!

function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  }
  next();
}

let latestLocation = null;

// POST location - Only devices with API Key can post
app.post('/location', checkApiKey, (req, res) => {
  const { latitude, longitude, timestamp } = req.body;

  // Basic Validation
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    typeof timestamp !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  latestLocation = { latitude, longitude, timestamp };
  res.status(200).json({ message: 'Location received' });
});

// GET location - Public read access
app.get('/location', (req, res) => {
  if (!latestLocation) {
    return res.status(404).json({ message: 'No location available' });
  }
  res.json(latestLocation);
});






const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

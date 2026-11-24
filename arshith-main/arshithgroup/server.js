const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Paste your Google Apps Script Webhook URL below or set process.env.GOOGLE_SHEET_WEBHOOK_URL
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';

// Forward submission to Google Sheets Webhook asynchronously
function forwardToGoogleSheets(appData) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) return;
  try {
    const postData = JSON.stringify(appData);
    const url = new URL(GOOGLE_SHEET_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      // Follow redirects if Google Apps Script returns 302/301
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        const redirOptions = {
          hostname: redirectUrl.hostname,
          path: redirectUrl.pathname + redirectUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        const redirReq = (redirectUrl.protocol === 'https:' ? https : http).request(redirOptions);
        redirReq.write(postData);
        redirReq.end();
      }
    });
    req.on('error', (e) => {
      console.warn('Google Sheets Webhook Notice:', e.message);
    });
    req.write(postData);
    req.end();
  } catch (err) {
    console.warn('Google Sheets forward error:', err.message);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Normalize URL
  let safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  // API Endpoint: Store Internship Applications in applications.json
  if (req.method === 'POST' && req.url === '/api/apply') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const appData = JSON.parse(body);
        const appsFile = path.join(ROOT, 'applications.json');
        let existingApps = [];
        if (fs.existsSync(appsFile)) {
          try {
            existingApps = JSON.parse(fs.readFileSync(appsFile, 'utf8'));
          } catch (e) {
            existingApps = [];
          }
        }
        appData.submittedAt = new Date().toLocaleString();
        existingApps.unshift(appData); // Newest submissions first
        fs.writeFileSync(appsFile, JSON.stringify(existingApps, null, 2), 'utf8');

        // Forward to Google Sheets Webhook if configured
        forwardToGoogleSheets(appData);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify({ status: 'success', message: 'Application saved successfully!', refCode: appData.refCode }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
    return;
  }

  // GET Endpoint to inspect saved applications
  if (req.method === 'GET' && req.url === '/api/applications') {
    const appsFile = path.join(ROOT, 'applications.json');
    let existingApps = [];
    if (fs.existsSync(appsFile)) {
      try {
        existingApps = JSON.parse(fs.readFileSync(appsFile, 'utf8'));
      } catch (e) {
        existingApps = [];
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(existingApps, null, 2));
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !filePath.startsWith(ROOT)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Also accessible at http://127.0.0.1:${PORT}/`);
});

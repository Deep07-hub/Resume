// Simple dedicated health check server
const http = require('http');

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests (for CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Return a simple JSON response for any request
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    time: new Date().toISOString(),
    message: 'Resume Parser healthcheck is running'
  }));
});

// Start the server on port 3002
server.listen(3002, '0.0.0.0', () => {
  console.log(`Health check server running on http://0.0.0.0:3002`);
}); 
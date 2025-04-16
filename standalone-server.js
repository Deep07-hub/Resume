// This file starts the Next.js application with proper hostname binding
// It should be copied to the .next/standalone directory

// Force binding to all network interfaces
process.env.HOSTNAME = '0.0.0.0';
process.env.HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';

// Load Next.js server code
require('./server.js'); 
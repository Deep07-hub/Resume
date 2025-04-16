// This file serves as a wrapper around the Next.js standalone server
// to ensure proper hostname binding

// Force the server to bind to all network interfaces
process.env.HOSTNAME = '0.0.0.0';
process.env.HOST = '0.0.0.0';

// Start the Next.js server directly
require('./node_modules/next/dist/server/next-server'); 
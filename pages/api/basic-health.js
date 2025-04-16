// Simple health check endpoint that doesn't rely on Next.js App Router
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    message: "Resume Parser API is running",
    nodeVersion: process.version,
    env: process.env.NODE_ENV
  });
} 
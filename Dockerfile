FROM node:18

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies using npm with legacy peer deps to bypass dependency conflicts
RUN npm install --legacy-peer-deps

# Install curl for health checks
RUN apt-get update && apt-get install -y curl

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Create test data directory for pdf-parse
RUN mkdir -p /app/node_modules/pdf-parse/test/data
RUN mkdir -p /app/test/data

# Create a dummy PDF file
RUN echo "%PDF-1.4\n1 0 obj\n<</Type /Catalog>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF" > /app/test/data/05-versions-space.pdf
RUN cp /app/test/data/05-versions-space.pdf /app/node_modules/pdf-parse/test/data/

# Make start script executable
RUN chmod +x start.sh

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 3002

# Set environment variables
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Start the application using our startup script
CMD ["./start.sh"] 
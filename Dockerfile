# Root Dockerfile for Google Cloud Build
# This builds the server application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server application code
COPY server/ ./

# Expose port (Cloud Run uses PORT env var, default 8080)
EXPOSE 8080

# Health check (uses PORT env var, defaults to 8080 for Cloud Run)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 8080; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]


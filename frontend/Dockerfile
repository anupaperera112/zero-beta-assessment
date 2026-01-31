 FROM node:18-bullseye-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY index.html ./

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "dev"]

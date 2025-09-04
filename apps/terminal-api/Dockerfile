
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/terminal-api/package*.json ./apps/terminal-api/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3000 8081

CMD ["npm", "run", "start:terminal-api"]

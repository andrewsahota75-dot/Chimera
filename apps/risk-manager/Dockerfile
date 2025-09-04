
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/risk-manager/package*.json ./apps/risk-manager/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

CMD ["npm", "run", "start:risk-manager"]

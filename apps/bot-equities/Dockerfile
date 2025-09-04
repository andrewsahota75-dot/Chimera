
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/bot-equities/package*.json ./apps/bot-equities/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

CMD ["npm", "run", "start:bot-equities"]

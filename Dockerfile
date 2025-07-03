# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (including dev dependencies for building)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose the port your NestJS app runs on
EXPOSE 3018

# Start the NestJS server
CMD ["npm", "run", "start:prod"] 
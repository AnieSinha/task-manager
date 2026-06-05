# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the React development port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
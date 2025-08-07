FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for installing dependencies
COPY package.json ./

# Install dependencies without dev dependencies
RUN npm cache clean --force && \
    npm install --production

# Copy the remaining application files
COPY . .

# Start the bot directly
CMD ["node", "index.js"]
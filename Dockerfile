FROM node:lts-bookworm-slim

# Set working directory
WORKDIR /app

# Install FFMPEG for audio support
RUN apt-get update

# Install FFMPEG for audio support
RUN apt-get install ffmpeg -y

# Copy package files for installing dependencies
COPY package*.json ./

# Install dependencies without dev dependencies
RUN npm install

# Copy the remaining application files
COPY . .

# Start the bot directly
CMD ["npm", "start"]
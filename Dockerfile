FROM node:18-alpine

# Install git to clone repositories if needed
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files for installing dependencies
COPY package*.json ./

# Install dependencies without dev dependencies
RUN npm install --production

# Copy the remaining application files
COPY . .

# Create a startup script to check for environment variables
RUN echo '#!/bin/sh\n\
if [ -z "$DISCORD_TOKEN" ]; then\n\
    echo "ERROR: DISCORD_TOKEN environment variable is required!"\n\
    exit 1\n\
fi\n\
echo "Starting Discord bot..."\n\
exec node index.js' > /app/start.sh && chmod +x /app/start.sh

# Use the startup script as the entry point
CMD ["/app/start.sh"]
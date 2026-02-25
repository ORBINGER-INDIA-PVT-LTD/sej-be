FROM node:20-alpine

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

ENV NODE_ENV=production

# Default app port (can be overridden with PORT env)
EXPOSE 8888

CMD ["npm", "start"]

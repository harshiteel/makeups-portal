# Stage 1: Install dependencies using a Node.js base image
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package.json and the lockfile
COPY package.json package-lock.json* ./

# Install dependencies using 'npm ci' which is faster and more reliable
# for reproducible builds than 'npm install'.
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .

# *** THE FIX IS HERE ***
# Copy the .env file to be used by the Next.js build process.
# This ensures that build-time environment variables are available.
COPY .env .

# Build the Next.js application using the script from your package.json
RUN npm run build

# Stage 3: Production image
# This is the final, small image that will be deployed.
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# The .env file is NOT copied here, so secrets are not in the final image.
# The values will be injected by Docker Compose at run-time instead.

# Copy the standalone Next.js output from the 'builder' stage.
# This includes only the necessary files to run the app.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3030

# The command to start the app.
# The 'standalone' output in your next.config.mjs creates a 'server.js' file
# that is run directly with Node.
CMD ["node", "server.js"]


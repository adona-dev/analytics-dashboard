# --- BUILD STAGE ---
FROM node:18-alpine AS build

WORKDIR /app

# Copy lock/manifest and fetch dependencies
COPY package*.json ./
RUN npm install

# Build static distribution
COPY . .
RUN npm run build

# --- RUNTIME STAGE ---
FROM nginx:1.25-alpine

# Copy compilation assets and custom configurations
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

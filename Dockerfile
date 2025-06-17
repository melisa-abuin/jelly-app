# Build the program
FROM node:22 AS builder

WORKDIR /app

# Install packages
COPY package.json .
COPY *.lock .

RUN yarn install

# Copy source
COPY . .

# Variables
ARG NODE_ENV=production
ARG VITE_LOCK_JELLYFIN_URL=""
ARG VITE_DEFAULT_JELLYFIN_URL=""

ENV NODE_ENV=$NODE_ENV
ENV VITE_LOCK_JELLYFIN_URL=$VITE_LOCK_JELLYFIN_URL
ENV VITE_DEFAULT_JELLYFIN_URL=$VITE_DEFAULT_JELLYFIN_URL

# Build application
RUN yarn build

# Serves with nginx
FROM nginx:mainline-alpine AS server

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf


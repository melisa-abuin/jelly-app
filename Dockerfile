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
ENV NODE_ENV=$NODE_ENV

# Build application
RUN yarn build

# Serves with nginx
FROM nginx:mainline-alpine AS server

RUN apk --update add jq

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docker/config.template.json /config.template.json
COPY --from=builder /app/docker/docker-entrypoint.sh /jelly-app.docker-entrypoint.sh

ENTRYPOINT ["/jelly-app.docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

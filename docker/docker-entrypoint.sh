#!/bin/sh

# Puts environment variables properly in the config JSON
envsubst < /config.template.json | jq 'with_entries(select(.value != "" and .value != null and .value != "null"))' > /usr/share/nginx/html/config.json

/docker-entrypoint.sh

exec "$@"
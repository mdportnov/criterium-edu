#!/bin/sh

envsubst '${BACKEND_PORT} ${FRONTEND_PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
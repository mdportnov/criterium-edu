#!/bin/sh

#envsubst '${BACKEND_PORT:3000} ${FRONTEND_PORT:3001}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
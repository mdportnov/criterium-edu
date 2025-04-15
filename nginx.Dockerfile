FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/nginx/nginx.conf /etc/nginx/conf.d/nginx.conf.template

COPY apps/nginx/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
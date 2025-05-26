FROM prom/prometheus

FROM alpine:3.10.2
RUN apk add gettext

COPY --from=0 /bin/prometheus /bin/prometheus

RUN mkdir -p /prometheus /etc/prometheus && \
chown -R nobody:nogroup etc/prometheus /prometheus
RUN echo $'#!/bin/sh\n\
envsubst < /etc/prometheus/prometheus-orig.yml > /etc/prometheus/prometheus.yml && \
envsubst < /etc/prometheus/web-orig.yml > /etc/prometheus/web.yml && \
exec /bin/prometheus "$@"' \
> /etc/prometheus/entrypoint.sh
RUN chmod +x /etc/prometheus/entrypoint.sh
ENTRYPOINT [ "/etc/prometheus/entrypoint.sh" ]

CMD [ "--config.file=/etc/prometheus/prometheus.yml", \
"--storage.tsdb.path=/prometheus", \
"--web.config.file=/etc/prometheus/web.yml" ]
USER nobody
WORKDIR /prometheus

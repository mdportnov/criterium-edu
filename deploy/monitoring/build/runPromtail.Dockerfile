FROM grafana/promtail:2.6.0

FROM fedora:35
RUN dnf -y install gettext

COPY --from=0 /usr/bin/promtail /usr/bin/promtail

RUN mkdir -p /promtail /etc/promtail && \
chown -R nobody etc/promtail /promtail
RUN echo $'#!/bin/sh\n\
envsubst < /etc/promtail/orig.yml > /etc/promtail/promtail.yml && \
exec /usr/bin/promtail "$@"' \
> /etc/promtail/entrypoint.sh
RUN chmod +x /etc/promtail/entrypoint.sh
ENTRYPOINT [ "/etc/promtail/entrypoint.sh" ]

CMD [ "-config.file=/etc/promtail/promtail.yml" ]
USER nobody
WORKDIR /promtail

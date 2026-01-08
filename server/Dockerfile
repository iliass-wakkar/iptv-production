FROM openresty/openresty:alpine

# Install Python for channel updater and auth server
RUN apk add --no-cache python3 py3-pip curl

# Install lua-resty-http for subrequests to auth server
RUN mkdir -p /usr/local/openresty/site/lualib/resty && \
    curl -sL https://raw.githubusercontent.com/ledgetech/lua-resty-http/master/lib/resty/http.lua \
    -o /usr/local/openresty/site/lualib/resty/http.lua && \
    curl -sL https://raw.githubusercontent.com/ledgetech/lua-resty-http/master/lib/resty/http_headers.lua \
    -o /usr/local/openresty/site/lualib/resty/http_headers.lua

# Create directories
RUN mkdir -p /etc/openresty/lua /etc/openresty/html /etc/openresty/data \
    /var/log/openresty /var/run/openresty /opt/iptv

# Copy config files
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY lua/ /etc/openresty/lua/
COPY html/ /etc/openresty/html/
COPY data/channels.json /etc/openresty/data/



# Copy updater scripts
COPY update_channels.py /opt/iptv/
COPY update_channels.sh /opt/iptv/
RUN chmod +x /opt/iptv/update_channels.sh



# Add cron job for daily updates at 4 AM
RUN echo "0 4 * * * /opt/iptv/update_channels.sh" >> /etc/crontabs/root

# Expose port 80
EXPOSE 80

# Environment variables (can be overridden with --env-file .env)
ENV SMTP_EMAIL=your-email@gmail.com
ENV SMTP_PASSWORD=
ENV SITE_URL=http://localhost:8080
ENV SITE_NAME="IPTV Web Player"
ENV TURNSTILE_SECRET_KEY=

# Copy backup script
COPY scripts/backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# Create directories
RUN mkdir -p /backups /etc/openresty/data

# Create startup script with cron for daily backup
RUN echo '#!/bin/sh' > /start.sh && \
    echo '# Create cron job for daily backup at 3 AM' >> /start.sh && \
    echo 'echo "0 3 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1" | crontab -' >> /start.sh && \
    echo 'crond' >> /start.sh && \
    echo '/usr/local/openresty/bin/openresty -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]

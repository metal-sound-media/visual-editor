# Development image — Node + PHP + Composer (Alpine, lightweight)
FROM node:22-alpine
RUN apk add --no-cache php83 php83-ctype php83-json php83-mbstring php83-tokenizer php83-phar php83-openssl curl \
    && ln -sf /usr/bin/php83 /usr/local/bin/php
RUN curl -sS https://getcomposer.org/installer | php83 -- \
    --install-dir=/usr/local/bin --filename=composer
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY composer*.json ./
RUN composer install --no-dev --optimize-autoloader
COPY . .
EXPOSE 3000 8000
CMD ["npm", "run", "dev", "--", "--host"]

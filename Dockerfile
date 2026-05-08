FROM cypress/base:22.17.1
USER root
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
RUN apt-get update && apt-get install -y --no-install-recommends \
    php-cli php-mbstring php-json php-tokenizer xauth \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY composer*.json ./
RUN composer install --no-dev --optimize-autoloader
COPY . .
EXPOSE 3000 8000
CMD ["npm", "run", "dev", "--", "--host"]

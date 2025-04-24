# Use the tiny Alpine build of PHP 8
FROM php:8.3-cli-alpine

# Copy your code into the image
WORKDIR /app
COPY . .

# Install ZipArchive
RUN apk add --no-cache libzip-dev zlib-dev \
 && docker-php-ext-configure zip \
 && docker-php-ext-install  zip

# Expose the dev-server port Render will map
EXPOSE 8000

# Start PHP’s built-in web server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]

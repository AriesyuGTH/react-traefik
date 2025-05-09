FROM node:18-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Set NODE_OPTIONS for OpenSSL legacy provider for subsequent RUN commands
ENV NODE_OPTIONS=--openssl-legacy-provider

# Install all dependencies, generate package-lock.json if not present or update if needed,
# executes post-install script and remove deps
RUN npm install && \
    npm run build-front && \
    rm -rf node_modules

# Install app production only dependencies
RUN npm install --production --ignore-scripts && npm cache clean --force && cp -rp ./node_modules /tmp/node_modules

EXPOSE 3001

CMD [ "npm", "start" ]

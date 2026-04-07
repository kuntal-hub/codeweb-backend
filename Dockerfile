
FROM node:24

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

COPY .env .
# Expose the port
ENV PORT 8080
EXPOSE 8080

CMD [ "npm", "run", "dev" ]
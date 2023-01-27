FROM node:18-alpine

RUN apk add curl vim

WORKDIR /app

COPY package.json /app/

RUN npm install

RUN npm install -g nodemon

COPY . .

COPY .env.example .env

CMD ["nodemon","app.js"]
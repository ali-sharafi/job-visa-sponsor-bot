FROM node:18

#Install puppeter section
RUN apt-get update && apt-get install -yq curl vim libgconf-2-4

RUN apt-get update && apt-get install -y wget --no-install-recommends \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get purge --auto-remove -y curl \
  && rm -rf /src/*.deb

#end section

WORKDIR /app

COPY package.json /app/

RUN npm install

RUN npm install -g nodemon

COPY . .

COPY .env.example .env

CMD ["nodemon","--ignore","storage/","app.js"]
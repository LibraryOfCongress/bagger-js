FROM node:latest
RUN npm install -g gulp && npm cache clear --force
RUN adduser --system --disabled-password --shell /bin/bash --group bagger --uid 1111
RUN install -d /opt/bagger --owner=bagger --group=bagger
WORKDIR /opt/bagger
USER bagger
COPY package.json /opt/bagger/
RUN npm install
COPY . /opt/bagger
RUN gulp
EXPOSE  8000
CMD npm start

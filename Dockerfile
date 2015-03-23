FROM iojs:latest
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get -qq update && apt-get -qqy install python3 && apt-get clean
RUN npm install -g gulp && npm cache clear
RUN adduser --system --disabled-password --shell /bin/bash --group bagger --uid 1000
RUN install -d /opt/bagger --owner=bagger --group=bagger
WORKDIR /opt/bagger
USER bagger
COPY package.json /opt/bagger/
RUN npm install
COPY . /opt/bagger
RUN gulp
EXPOSE  8000
CMD npm start

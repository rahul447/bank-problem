FROM node:8
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENV NODE_ENV docker
CMD node bin/www
# No need to expose as this container will be referred internally
EXPOSE 3021
#RUN apt-get update && apt-get -y install net-tools
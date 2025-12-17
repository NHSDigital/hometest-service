FROM node:22-alpine

COPY . /sandbox

WORKDIR /sandbox

RUN npm install --production

EXPOSE 9000

CMD ["node", "app.js"]
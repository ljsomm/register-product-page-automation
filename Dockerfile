FROM node:24

WORKDIR /app

COPY . .

RUN npm install

RUN npx playwright install

RUN npx playwright install-deps

RUN npm run build

CMD ["npm", "run", "start"]

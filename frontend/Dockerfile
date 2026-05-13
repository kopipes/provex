FROM node:22-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://provex.provaliantgroup.com

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]

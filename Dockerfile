FROM node:20-alpine AS build

WORKDIR /app

COPY react-prototipo/package.json react-prototipo/package-lock.json ./
RUN npm ci

COPY react-prototipo/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime

ENV PORT=8080

COPY react-prototipo/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
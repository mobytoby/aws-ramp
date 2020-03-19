# base image
FROM node:13.8.0 as base

# set working directory
WORKDIR /app

FROM base as build
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@9.0.5

# add app
COPY . /app

# generate build
RUN npm run build:ssr

############
### prod ###
############

# base image
FROM base as prod

# copy artifact build from the 'build environment'
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/

ENV NODE_ENV "production"
ENV PORT 3000

EXPOSE 3000

CMD ["npm", "run ", "serve:ssr"]

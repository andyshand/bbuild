# User the python 3.8 container image
FROM node:18.16.1 AS base

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Install Infisical
# RUN curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash
# RUN apt-get update && apt-get install -y infisical

# RUN infisical run -e prod -- yarn build

FROM base

WORKDIR /mtyk/compiler

# Copy only pnpm-lock.yaml and packag.json
COPY ./compiler/pnpm-lock.yaml ./compiler/package.json /mtyk/compiler/
RUN pnpm install
RUN pnpm exec ts-patch i

COPY . /mtyk

RUN rm -rf dist && pnpm run build

COPY ./init.sh /mtyk
WORKDIR /mtyk
RUN ["chmod", "+x", "./init.sh"]
CMD ./init.sh
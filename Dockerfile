# The docs site: static Astro build served by nginx.
#   docker build -t ghcr.io/arkiv-network/arkiv-docs:prod .
# Defaults build production; stage: --build-arg SITE_URL=https://stage-docs.arkiv.network
#   --build-arg SDK_DOCS_REF=develop
# Build with --no-cache: the SDK is cloned during the build, so a cached layer
# would keep documenting an old SDK version.
FROM oven/bun:1.4.4@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d AS build
# The SDK reference is generated from arkiv-sdk-js, cloned at SDK_DOCS_REF
# ("latest" = newest release tag).
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends git ca-certificates >/dev/null \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY . .
RUN bun install --frozen-lockfile
ARG SITE_URL=https://docs.arkiv.network
ARG SDK_DOCS_REF=latest
ARG SITE_BANNER=
ARG SITE_BANNER_URL=
RUN SITE_URL=$SITE_URL SDK_DOCS_REF=$SDK_DOCS_REF SITE_BANNER=$SITE_BANNER SITE_BANNER_URL=$SITE_BANNER_URL bun run build

FROM nginx:1.31.8-alpine@sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

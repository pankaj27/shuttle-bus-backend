FROM node:22-bookworm-slim
 
RUN mkdir -p /home/app
 
WORKDIR /home/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
 
COPY package*.json ./
# To copy both package.json and package-lock.json to the working directory (/home/app) of the Alpine image.
# Prior to copying the entire current working directory, we copy the package.json file to the working directory (/home/app) of the Alpine image. This allows to take advantage of any cached layers.

# Install cross-env globally
RUN npm install -g cross-env


RUN npm install
# This will create a node_modules folder in /home/app and
# install all the dependencies specified in the package.json file.
 
COPY . .
# Here “.” represents the current working directory.
# This command will copy all the files in the current directory to the working directory (/home/app) of the Alpine image.
 
EXPOSE 8080
 
CMD ["npm", "start"]
# One important thing to notice here is that “RUN” executes while the image creation process is running
# and “CMD” executes only after the image creation process is finished.
# One Dockerfile may consist of more than one "RUN" command, but it can only consist of one "CMD" command.

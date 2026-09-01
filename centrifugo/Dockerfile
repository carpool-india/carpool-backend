FROM centrifugo/centrifugo:v5
COPY config.json /centrifugo/config.json
WORKDIR /centrifugo
EXPOSE 8000
CMD ["centrifugo", "-c", "config.json"]

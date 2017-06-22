#!/bin/bash

url="http://localhost:8080/heartbeat"

curl -s -f -w "HTTP Code %{http_code}\n" \
    --form-string "uptime=1657" \
    --form-string "server=Prod" \
    --form-string "version=0.1" \
    "$url"

curl -s -f -w "HTTP Code %{http_code}\n" \
    --form-string "uptime=10565" \
    --form-string "server=Devel" \
    --form-string "version=0.2" \
    "$url"

sleep 5

curl -s -f -w "HTTP Code %{http_code}\n" \
    --form-string "uptime=1663" \
    --form-string "server=Prod" \
    --form-string "version=0.1" \
    "$url"

curl -s -f -w "HTTP Code %{http_code}\n" \
    --form-string "uptime=10575" \
    --form-string "server=Devel" \
    --form-string "version=0.2" \
    "$url"

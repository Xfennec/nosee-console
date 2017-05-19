#!/bin/bash

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=BAD' \
    --form-string 'subject=[BAD] Julien-XPS13: 0test check (devel test)' \
    --form-string 'classes=warning,infra' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d4' \
    --form-string 'datetime=2017-05-17T10:11:55+02:00' \
    'http://localhost:8080/alerts'

sleep 2

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=BAD' \
    --form-string 'subject=[BAD] Julien-XPS13: 0test2 check (devel test2)' \
    --form-string 'classes=critical' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d5' \
    --form-string 'datetime=2017-05-17T10:13:59+02:00' \
    'http://localhost:8080/alerts'

sleep 2

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=GOOD' \
    --form-string 'subject=[GOOD] Julien-XPS13: 0test2 check (devel test2)' \
    --form-string 'classes=critical' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d5' \
    --form-string 'datetime=2017-05-17T10:23:01+02:00' \
    'http://localhost:8080/alerts'

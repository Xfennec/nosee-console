#!/bin/bash

DETAILS='
An alert **is** ringing.

Failure time: 20xx-xx-xx xx:37:41
Last task time: 20xx-xx-xx xx:37:41
Class(es): xxxx
Failed condition was: TEST_FAILED == 1

Values:
- TEST_FAILED: 1

All values for this run (1.112404368s):
- mail.quiris.com certificate validity (47.999909ms):
--- CERT_WILL_EXPIRE_MAIL_QUIRIS: 0
- CPU temperature (13.682033ms):
--- CPU0_TEMP: 25
- disk free (30.178959ms):
--- DISK_FULLEST_PERC: 22
--- DF_ROOT_PERC: 22
--- DF_BOOT_PERC: 18
--- DF_BOOT_EFI_PERC: 5
--- DF_HOME_PERC: 15
- system load (18.514627ms):
--- LOAD: 0.12
--- CPU_COUNT: 4
--- LOAD_PROG_DETECTED: 1
- Linux md-raid states (12.201576ms):
--- MDRAID_ERR_ARRAYS: 0
- ping to Google (875.044679ms):
--- PING_LOSS_PERC: 0
--- PING_AVG_MS: 19.346
- devel test (25.31626ms):
--- TEST_FAILED: 1

Unique failure ID: xxxxxxxxxx
'

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=BAD' \
    --form-string 'subject=[BAD] Julien-XPS13: 0test check (devel test)' \
    --form-string "details=$DETAILS" \
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
    --form-string "details=$DETAILS" \
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
    --form-string "details=$DETAILS" \
    --form-string 'classes=critical' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d5' \
    --form-string 'datetime=2017-05-17T10:23:01+02:00' \
    'http://localhost:8080/alerts'

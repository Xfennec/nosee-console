#!/bin/bash

DETAILS='An alert **is** ringing.

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
    --form-string 'subject=[BAD] QuiriX: heavy system load (system load)' \
    --form-string "details=$DETAILS" \
    --form-string 'classes=warning,infra' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d4' \
    --form-string 'datetime=2017-05-17T12:31:55+02:00' \
    'http://localhost:8080/alerts'

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=BAD' \
    --form-string 'subject=[BAD] Intraquiris0: run error(s)' \
    --form-string "details=$DETAILS" \
    --form-string 'classes=general' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d5' \
    --form-string 'datetime=2017-05-17T10:12:55+02:00' \
    'http://localhost:8080/alerts'

curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=BAD' \
    --form-string 'subject=[GOOD] QClone: heavy system load (system load)' \
    --form-string "details=$DETAILS" \
    --form-string 'classes=general' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d6' \
    --form-string 'datetime=2017-05-17T05:10:55+02:00' \
    'http://localhost:8080/alerts'
curl -w "%{http_code}\n" -XPOST \
    --form-string 'type=GOOD' \
    --form-string 'subject=[GOOD] QClone: heavy system load (system load)' \
    --form-string "details=$DETAILS" \
    --form-string 'classes=general' \
    --form-string 'hostname=Julien-XPS13' \
    --form-string 'nosee_srv=Devel' \
    --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d6' \
    --form-string 'datetime=2017-05-17T05:18:55+02:00' \
    'http://localhost:8080/alerts'


    curl -w "%{http_code}\n" -XPOST \
        --form-string 'type=BAD' \
        --form-string 'subject=[GOOD] QClone: disk almost full (disk free)' \
        --form-string "details=$DETAILS" \
        --form-string 'classes=general' \
        --form-string 'hostname=Julien-XPS13' \
        --form-string 'nosee_srv=Devel' \
        --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d7' \
        --form-string 'datetime=2017-05-17T03:26:55+02:00' \
        'http://localhost:8080/alerts'
    curl -w "%{http_code}\n" -XPOST \
        --form-string 'type=GOOD' \
        --form-string 'subject=[GOOD] QClone: disk almost full (disk free)' \
        --form-string "details=$DETAILS" \
        --form-string 'classes=general' \
        --form-string 'hostname=Julien-XPS13' \
        --form-string 'nosee_srv=Devel' \
        --form-string 'uniqueid=96f5018e-9376-4d18-9052-6c4bf42e36d7' \
        --form-string 'datetime=2017-05-17T04:26:55+02:00' \
        'http://localhost:8080/alerts'

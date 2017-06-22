package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"sync"
	"time"
)

// AlertGood and AlertBad maps Nosee AlertMessageType
const (
	AlertGood string = "GOOD"
	AlertBad  string = "BAD"
)

const statusFile string = "nosee-console-alerts.json"

// Alert follows Nosee's idea of an alert message
type Alert struct {
	Type        string
	Subject     string
	NoseeSrv    string
	Hostname    string
	Classes     []string
	UniqueID    string
	BadTime     time.Time
	GoodTime    time.Time
	BadDetails  string
	GoodDetails string
}

// currentAlerts is a "thread-safe" map of all alerts
// Map key is the UniqueID
var (
	currentAlerts      map[string]*Alert
	currentAlertsMutex sync.Mutex
)

func currentAlertsSave() {
	// doing this in a go routine allows this function to be called
	// by functions that are already locking the mutex
	go func() {
		currentAlertsMutex.Lock()
		defer currentAlertsMutex.Unlock()

		f, err := os.Create(path.Clean(*savePath + "/" + statusFile))
		if err != nil {
			log.Fatalf("can't save status, %s", err)
		}
		defer f.Close()

		enc := json.NewEncoder(f)
		err = enc.Encode(&currentAlerts)
		if err != nil {
			log.Fatalf("status json encode: %s", err)
		}
		log.Printf("status saved")
	}()
}

func currentAlertsLoad() {
	currentAlertsMutex.Lock()
	defer currentAlertsMutex.Unlock()

	f, err := os.Open(path.Clean(*savePath + "/" + statusFile))
	if err != nil {
		log.Printf("can't read previous status: %s, no alert loaded", err)
		return
	}
	defer f.Close()

	dec := json.NewDecoder(f)
	err = dec.Decode(&currentAlerts)
	if err != nil {
		log.Fatalf("status json decode: %s", err)
	}
	log.Printf("status loaded: %d alert(s)", len(currentAlerts))
}

func currentAlertsPurge(hub *Hub, expireHours int) {
	currentAlertsMutex.Lock()
	defer currentAlertsMutex.Unlock()
	for hash, alert := range currentAlerts {
		if alert.Type == AlertBad {
			continue
		}
		since := time.Since(alert.GoodTime)
		if since > time.Duration(expireHours)*time.Hour {
			delete(currentAlerts, hash)
			currentAlertsSave()
			hub.Broadcast("purged")
			log.Printf("deleting old alert (%s)", alert.Subject)
		}
	}
}

func currentAlertsPurger(hub *Hub, expireHours int) {
	for {
		currentAlertsPurge(hub, expireHours)
		time.Sleep(30 * time.Second)
	}
}

func currentAlertsCreate() {
	currentAlerts = make(map[string]*Alert)
}

// should notify the WS…
// func currentAlertsDelete(hash string) {
// 	currentAlertsMutex.Lock()
// 	defer currentAlertsMutex.Unlock()
// 	delete(currentAlerts, hash)
// }

func currentAlertsAdd(hash string, alert *Alert) error {
	currentAlertsMutex.Lock()
	defer currentAlertsMutex.Unlock()
	if _, exists := currentAlerts[hash]; exists == true {
		return fmt.Errorf("hash for this alert already exists (%s)", hash)
	}
	currentAlerts[hash] = alert
	currentAlertsSave()
	return nil
}

func currentAlertsExists(hash string) bool {
	currentAlertsMutex.Lock()
	defer currentAlertsMutex.Unlock()
	_, exists := currentAlerts[hash]
	return exists
}

func currentAlertsUpdate(hash string, alert *Alert) error {
	if currentAlertsExists(hash) == false {
		return fmt.Errorf("can't update a non-existing alert (%s)", hash)
	}
	currentAlertsMutex.Lock()
	defer currentAlertsMutex.Unlock()

	if currentAlerts[hash].Type == AlertGood {
		return fmt.Errorf("alert is already good, can't update (%s)", hash)
	}

	badTime := currentAlerts[hash].BadTime
	badDetails := currentAlerts[hash].BadDetails
	currentAlerts[hash] = alert
	currentAlerts[hash].BadTime = badTime
	currentAlerts[hash].BadDetails = badDetails
	currentAlertsSave()
	return nil
}

func serveAlerts(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// GET -> return collection
	// POST -> add new message to collection or
	//         update a message from BAD to GOOD
	switch r.Method {
	case "GET":
		w.Header().Set("Content-Type", "application/json")
		currentAlertsMutex.Lock()
		defer currentAlertsMutex.Unlock()
		json.NewEncoder(w).Encode(currentAlerts)
	case "POST":
		subject := r.PostFormValue("subject")
		typeMsg := r.PostFormValue("type")
		classesStr := r.PostFormValue("classes")
		hostname := r.PostFormValue("hostname")
		noseeSrv := r.PostFormValue("nosee_srv")
		uniqueid := r.PostFormValue("uniqueid")
		datetimeStr := r.PostFormValue("datetime")
		details := r.PostFormValue("details")

		if subject == "" {
			http.Error(w, "Invalid request: empty subject", 400)
			return
		}

		if details == "" {
			http.Error(w, "Invalid request: empty details", 400)
			return
		}

		if typeMsg != AlertGood && typeMsg != AlertBad {
			http.Error(w, "Invalid request: type empty or unknown: '"+typeMsg+"'", 400)
			return
		}

		if classesStr == "" {
			http.Error(w, "Invalid request: empty classes", 400)
			return
		}

		if hostname == "" {
			http.Error(w, "Invalid request: empty hostname", 400)
			return
		}

		if noseeSrv == "" {
			http.Error(w, "Invalid request: empty nosee_srv", 400)
			return
		}

		if uniqueid == "" {
			http.Error(w, "Invalid request: empty uniqueid", 400)
			return
		}

		datetime, errorDatetime := time.Parse(time.RFC3339, datetimeStr)
		if errorDatetime != nil {
			http.Error(w, "Invalid request: can't parse datetime: "+errorDatetime.Error(), 400)
			return
		}

		classes := strings.Split(classesStr, ",")

		alert := Alert{
			Type:     typeMsg,
			Subject:  subject,
			NoseeSrv: noseeSrv,
			Hostname: hostname,
			Classes:  classes,
			UniqueID: uniqueid,
		}

		if typeMsg == "GOOD" {
			alert.GoodTime = datetime
			alert.GoodDetails = details
			if currentAlertsExists(uniqueid) {
				// will preserve previous BadTime
				if error := currentAlertsUpdate(uniqueid, &alert); error != nil {
					log.Println(error)
					http.Error(w, error.Error(), 400)
					return
				}
				fmt.Fprintf(w, "updated\n")
				hub.Broadcast("fixed")
				return
			}
			// we don't have the corresponding "BAD", let's create it
		}
		alert.BadDetails = details
		alert.BadTime = datetime

		if error := currentAlertsAdd(uniqueid, &alert); error != nil {
			log.Println(error)
			http.Error(w, error.Error(), 400)
			return
		}
		fmt.Fprintf(w, "created\n")
		hub.Broadcast("created")
	default:
		http.Error(w, "Invalid request method.", 405)
	}
}

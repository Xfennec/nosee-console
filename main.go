package main

import (
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")
var staticPath = flag.String("static-path", "static", "path to static Web files")
var goodExpiration = flag.Int("good-expiration", 72, "'GOOD' alerts expires after x hours")

func main() {
	flag.Parse()
	currentAlertsCreate()
	hub := newHub()
	// "register" purge of old Alerts
	go currentAlertsPurger(hub, *goodExpiration)
	go hub.run()

	// force client to validate his cache for each request (and probably get a 304)
	setCacheControlThenServe := func(h http.Handler) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "max-age=0, must-revalidate")
			h.ServeHTTP(w, r)
		}
	}

	fs := setCacheControlThenServe(http.FileServer(http.Dir(*staticPath)))

	http.Handle("/", fs)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	http.HandleFunc("/alerts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		serveAlerts(hub, w, r)
	})

	log.Println("Listening:", *addr)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

package main

import (
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")
var staticPath = flag.String("static-path", "static", "path to static Web files")

func main() {
	flag.Parse()
	currentAlertsCreate()
	hub := newHub()
	go hub.run()

	fs := http.FileServer(http.Dir(*staticPath))

	http.Handle("/", fs)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	http.HandleFunc("/alerts", func(w http.ResponseWriter, r *http.Request) {
		serveAlerts(hub, w, r)
	})

	log.Println("Listening:", *addr)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

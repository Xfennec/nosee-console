package main

import (
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()
	currentAlertsCreate()
	hub := newHub()
	go hub.run()

	fs := http.FileServer(http.Dir("static"))

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

package main

import (
	"fmt"
	"net/http"
	"strconv"
)

func serveHeartbeat(hub *Hub, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "POST":
		server := r.PostFormValue("server")
		version := r.PostFormValue("version")
		uptime := r.PostFormValue("uptime")

		uptimeInt, _ := strconv.Atoi(uptime)

		// crude data "encoding":
		hub.Broadcast(fmt.Sprintf("heartbeat|%s|%s|%d", server, version, uptimeInt))
		fmt.Fprintf(w, "heartbeat\n")
	default:
		http.Error(w, "Invalid request method.", 405)
	}
}

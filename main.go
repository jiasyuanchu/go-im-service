package main

import "github.com/jiasyuanchu/go-im-service/server"

func main() {
	s := server.NewServer()
	s.SetupRoutes()
	s.Run()
}
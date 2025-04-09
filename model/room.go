package model

import "sync"

type Room struct {
	Clients    map[string]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan string
	Mutex      sync.Mutex
}

func NewRoom() *Room {
	return &Room{
		Clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan string),
	}
}

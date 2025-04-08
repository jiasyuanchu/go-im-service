package service

import (
	"log"

	"github.com/jiasyuanchu/go-im-service/model"
)

// RoomService manages the chat room logic
type RoomService struct {
	room *model.Room
}

// NewRoomService creates a new RoomService
func NewRoomService() *RoomService {
	room := model.NewRoom()
	return &RoomService{room: room}
}

// Run starts the chat room
func (rs *RoomService) Run() {
	for {
		select {
		case client := <-rs.room.Register:
			rs.room.Mutex.Lock() // 改為大寫 Mutex
			rs.room.Clients[client.ID] = client
			rs.room.Mutex.Unlock()
			log.Printf("Client %s joined with username: %s\n", client.ID, client.Username)

		case client := <-rs.room.Unregister:
			rs.room.Mutex.Lock() // 改為大寫 Mutex
			if _, ok := rs.room.Clients[client.ID]; ok {
				delete(rs.room.Clients, client.ID)
				close(client.Send)
			}
			rs.room.Mutex.Unlock()
			log.Printf("Client %s left\n", client.ID)

		case message := <-rs.room.Broadcast:
			rs.room.Mutex.Lock() // 改為大寫 Mutex
			for _, client := range rs.room.Clients {
				select {
				case client.Send <- []byte(message):
				default:
					close(client.Send)
					delete(rs.room.Clients, client.ID)
				}
			}
			rs.room.Mutex.Unlock()
		}
	}
}

// GetRoom returns the room instance
func (rs *RoomService) GetRoom() *model.Room {
	return rs.room
}

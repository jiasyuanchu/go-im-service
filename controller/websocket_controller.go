package controller

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jiasyuanchu/go-im-service/model"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all CORS requests, should be restricted in production
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocketController handles WebSocket connections
type WebSocketController struct {
	room *model.Room
}

// NewWebSocketController creates a new WebSocketController
func NewWebSocketController(room *model.Room) *WebSocketController {
	return &WebSocketController{room: room}
}

// HandleWebSocket upgrades HTTP connection to WebSocket and manages clients
func (wsc *WebSocketController) HandleWebSocket(c *gin.Context) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}

	// Get username from URL query parameters
	username := c.Query("username")
	if username == "" {
		username = "Anonymous User"
	}

	// Create new client
	clientID := fmt.Sprintf("%s-%p", username, conn)
	client := &model.Client{
		ID:       clientID,
		Conn:     conn,
		Username: username,
		Send:     make(chan []byte, 256),
	}

	// Register the client
	wsc.room.Register <- client

	// Start read/write goroutines
	go client.ReadPump(wsc.room)
	go client.WritePump()
}

package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Client structure
type Client struct {
	ID       string
	Conn     *websocket.Conn
	Username string
	Send     chan []byte
}

// Message structure
type Message struct {
	Type    string `json:"type"`    // Message type: join, message, leave
	Content string `json:"content"` // Message content
	Sender  string `json:"sender"`  // Sender name
}

// Chat room structure
type Room struct {
	Clients    map[string]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte
	mutex      sync.Mutex
}

// Initialize a new chat room
func NewRoom() *Room {
	return &Room{
		Clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
}

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all CORS requests, should be restricted in production
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Run the chat room
func (room *Room) Run() {
	for {
		select {
		case client := <-room.Register:
			room.mutex.Lock()
			room.Clients[client.ID] = client
			room.mutex.Unlock()
			log.Printf("Client %s joined with username: %s\n", client.ID, client.Username)

		case client := <-room.Unregister:
			room.mutex.Lock()
			if _, ok := room.Clients[client.ID]; ok {
				delete(room.Clients, client.ID)
				close(client.Send)
			}
			room.mutex.Unlock()
			log.Printf("Client %s left\n", client.ID)

		case message := <-room.Broadcast:
			room.mutex.Lock()
			for _, client := range room.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(room.Clients, client.ID)
				}
			}
			room.mutex.Unlock()
		}
	}
}

// Handle WebSocket connection
func (room *Room) HandleWebSocket(c *gin.Context) {
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
	client := &Client{
		ID:       clientID,
		Conn:     conn,
		Username: username,
		Send:     make(chan []byte, 256),
	}

	// Register the client
	room.Register <- client

	// Start read/write goroutines
	go client.readPump(room)
	go client.writePump()
}

// Client message reading loop
func (c *Client) readPump(room *Room) {
	defer func() {
		room.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Forward message to broadcast channel
		room.Broadcast <- message
	}
}

func main() {
	// Create Gin router
	r := gin.Default()

	// Create chat room
	room := NewRoom()
	go room.Run()

	// Serve static files
	r.Static("/static", "./static")

	// Home page
	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// WebSocket endpoint
	r.GET("/ws", func(c *gin.Context) {
		room.HandleWebSocket(c)
	})

	// Start server
	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

// Client message writing loop
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second) // every 30 seconds
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, []byte("ping")); err != nil {
				return
			}
		}
	}
}

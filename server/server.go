package server

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jiasyuanchu/go-im-service/controller"
	"github.com/jiasyuanchu/go-im-service/service"
)

// Server manages the HTTP server
type Server struct {
	router       *gin.Engine
	roomService  *service.RoomService
	wsController *controller.WebSocketController
}

// NewServer creates a new Server instance
func NewServer() *Server {
	// Initialize router
	router := gin.Default()

	// Initialize room service
	roomService := service.NewRoomService()
	go roomService.Run()

	// Initialize WebSocket controller
	wsController := controller.NewWebSocketController(roomService.GetRoom())

	return &Server{
		router:       router,
		roomService:  roomService,
		wsController: wsController,
	}
}

// SetupRoutes configures the server routes
func (s *Server) SetupRoutes() {
	// Serve static files
	s.router.Static("/static", "./static")

	// Home page
	s.router.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// WebSocket endpoint
	s.router.GET("/ws", s.wsController.HandleWebSocket)
}

// Run starts the server
func (s *Server) Run() {
	log.Println("Server starting on :8080")
	if err := s.router.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
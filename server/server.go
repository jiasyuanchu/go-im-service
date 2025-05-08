package server

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jiasyuanchu/go-im-service/controller"
	"github.com/jiasyuanchu/go-im-service/service"
)

type Server struct {
	router       *gin.Engine
	roomService  *service.RoomService
	wsController *controller.WebSocketController
}

func NewServer() *Server {

	router := gin.Default()

	roomService := service.NewRoomService()
	go roomService.Run()

	wsController := controller.NewWebSocketController(roomService.GetRoom())

	return &Server{
		router:       router,
		roomService:  roomService,
		wsController: wsController,
	}
}

func (s *Server) SetupRoutes() {
	s.router.Static("/static", "./static")

	s.router.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})

	s.router.GET("/ws", s.wsController.HandleWebSocket)
}

func (s *Server) Run() {
	log.Println("Server starting on :8080")
	if err := s.router.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
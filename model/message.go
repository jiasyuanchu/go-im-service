package model

// Message structure
type Message struct {
	Type    string `json:"type"`    // Message type: join, message, leave
	Content string `json:"content"` // Message content
	Sender  string `json:"sender"`  // Sender name
}
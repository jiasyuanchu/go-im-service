let socket = null;

function connect() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter your name.");
    return;
  }

  socket = new WebSocket(`ws://${location.host}/ws?username=${encodeURIComponent(username)}`);

  socket.onopen = () => {
    console.log("Connected to server.");
  };

  socket.onmessage = (event) => {
    const chatBox = document.getElementById("chatBox");
    const message = JSON.parse(event.data);
    const div = document.createElement("div");
    div.classList.add("message");
    div.textContent = `[${message.sender}]: ${message.content}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  socket.onclose = () => {
    console.log("Disconnected from server.");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (message && socket && socket.readyState === WebSocket.OPEN) {
    const payload = {
      type: "message",
      content: message,
      sender: document.getElementById("username").value.trim()
    };
    socket.send(JSON.stringify(payload));
    input.value = "";
  }
}

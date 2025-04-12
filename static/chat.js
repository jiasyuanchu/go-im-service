document.addEventListener('DOMContentLoaded', () => {
  const joinSection = document.getElementById('join-section');
  const chatSection = document.getElementById('chat-section');
  const usernameInput = document.getElementById('username');
  const joinBtn = document.getElementById('join-btn');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesDiv = document.getElementById('messages');
  const userColors = new Map();
  const colorPool = [
    '#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#FFD700',
    '#FFA07A', '#20B2AA', '#F08080', '#ADFF2F', '#FF69B4'
  ];
  let colorIndex = 0;
  let ws = null;

  function joinChat() {
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter a username!");
      return;
    }

    ws = new WebSocket(`ws://localhost:8080/ws?username=${encodeURIComponent(username)}`);

    ws.onopen = function () {
      console.log("Connected to WebSocket server");
      joinSection.style.display = "none";
      chatSection.style.display = "block";

      const joinMessage = {
        type: "join",
        content: `${username} joined the chat`,
        sender: username
      };
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = function (event) {
      const message = JSON.parse(event.data);
      displayMessage(message);
    };

    ws.onclose = function () {
      console.log("Disconnected from WebSocket server");
      displayMessage({
        type: "system",
        content: "Disconnected from server",
        sender: "System"
      });
      // 顯示加入區域，隱藏聊天區域
      joinSection.style.display = "block";
      chatSection.style.display = "none";
    };

    ws.onerror = function (error) {
      console.error("WebSocket error:", error);
      displayMessage({
        type: "system",
        content: "Failed to connect to the server. Please try again later.",
        sender: "System"
      });
    };
  }

  // 根據 username 分配顏色，確保不重複
  function getColorFromUsername(username) {
    if (!userColors.has(username)) {
      // 如果該使用者還沒有顏色，分配一個新的
      const color = colorPool[colorIndex % colorPool.length];
      userColors.set(username, color);
      colorIndex++;
    }
    return userColors.get(username);
  }

  function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) {
      alert("Please enter a message!");
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      const username = usernameInput.value.trim();
      const message = {
        type: "message",
        content: content,
        sender: username
      };
      ws.send(JSON.stringify(message));
      messageInput.value = ""; // 清空輸入框
    } else {
      alert("Not connected to the chat server!");
    }
  }

  function getColorFromUsername(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360; // HSL 色相範圍 0-360
    return `hsl(${hue}, 70%, 80%)`; // 使用 HSL 顏色，保持飽和度和亮度一致
  }

  function displayMessage(message) {
    const messageElement = document.createElement("p");
    const timestamp = new Date().toLocaleTimeString();

    if (message.type === "system" || message.type === "join" || message.type === "leave") {
      messageElement.className = "system-message";
      messageElement.textContent = `[${timestamp}] ${message.content}`;
    } else {
      messageElement.className = "user-message";
      const userColor = getColorFromUsername(message.sender); // 獲取或分配顏色
      messageElement.style.backgroundColor = userColor;
      messageElement.style.color = "#333";
      messageElement.textContent = `[${timestamp}] ${message.sender}: ${message.content}`;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // 當使用者離開時清理顏色（可選）
  window.onbeforeunload = function () {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const username = usernameInput.value.trim();
      const leaveMessage = {
        type: "leave",
        content: `${username} left the chat`,
        sender: username
      };
      ws.send(JSON.stringify(leaveMessage));
      ws.close();
      userColors.delete(username); // 清理該使用者的顏色
    }
  };

  joinBtn.addEventListener('click', joinChat);
  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
});
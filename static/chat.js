document.addEventListener('DOMContentLoaded', () => {
  const joinSection = document.getElementById('join-section');
  const chatSection = document.getElementById('chat-section');
  const usernameInput = document.getElementById('username');
  const joinBtn = document.getElementById('join-btn');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesDiv = document.getElementById('messages');
  let ws = null;

  // 加入聊天室
  function joinChat() {
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter a username!");
      return;
    }

    // 建立 WebSocket 連線
    ws = new WebSocket(`ws://localhost:8080/ws?username=${encodeURIComponent(username)}`);

    ws.onopen = function () {
      console.log("Connected to WebSocket server");
      // 隱藏加入區域，顯示聊天區域
      joinSection.style.display = "none";
      chatSection.style.display = "block";

      // 發送加入訊息
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

  // 發送訊息
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

  // 顯示訊息
  function displayMessage(message) {
    const messageElement = document.createElement("p");
    const timestamp = new Date().toLocaleTimeString();

    if (message.type === "system" || message.type === "join" || message.type === "leave") {
      // 系統訊息（加入、離開、斷線等）
      messageElement.className = "system-message";
      messageElement.textContent = `[${timestamp}] ${message.content}`;
    } else {
      // 使用者訊息
      messageElement.className = "user-message";
      messageElement.textContent = `[${timestamp}] ${message.sender}: ${message.content}`;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // 自動滾動到底部
  }

  // 處理離開聊天室
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
    }
  };

  // 綁定按鈕事件
  joinBtn.addEventListener('click', joinChat);
  sendBtn.addEventListener('click', sendMessage);

  // 支援 Enter 鍵發送訊息
  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
});
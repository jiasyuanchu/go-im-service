document.addEventListener('DOMContentLoaded', () => {
  const emojiBtn = document.getElementById('emoji-btn');
  if (emojiBtn) {
    emojiBtn.addEventListener('click', function () {
      const emojiList = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "✨", "😁", "👋", "🙌", "🤔", "👀", "🌟"];
      const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
      const messageInput = document.getElementById('message-input');
      messageInput.value += randomEmoji;
      messageInput.focus();
    });
  }

  function enhanceMessages() {
    const messages = document.querySelectorAll('#messages p.user-message');
    messages.forEach(msg => {
      if (!msg.querySelector('.message-meta') && msg.textContent.includes(']:')) {
        const text = msg.textContent;
        const timeMatch = text.match(/\[(.*?)\]/);
        const senderMatch = text.match(/\]\s+(.*?):/);

        if (timeMatch && senderMatch) {
          const time = timeMatch[1];
          const sender = senderMatch[1];
          const content = text.substring(text.indexOf(':') + 1).trim();

          if (msg.childNodes.length === 1 && msg.firstChild.nodeType === Node.TEXT_NODE) {
            msg.innerHTML = '';

            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-meta';
            metaDiv.textContent = sender + ' · ' + time;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content;

            msg.appendChild(metaDiv);
            msg.appendChild(contentDiv);
          }
        }
      }
    });
  }

  const messagesDiv = document.getElementById('messages');
  if (messagesDiv) {
    const observer = new MutationObserver(function (mutations) {
      enhanceMessages();
    });

    observer.observe(messagesDiv, { childList: true });
  }
});
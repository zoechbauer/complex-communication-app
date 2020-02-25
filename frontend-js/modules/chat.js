export default class Chat {
  constructor() {
    this.chatWrapper = document.querySelector('#chat-wrapper');
    this.chatIcon = document.querySelector('.header-chat-icon');
    this.injectHTML();
    this.chatField = document.querySelector('#chatField');
    this.chatForm = document.querySelector('#chatForm');
    this.closeIcon = document.querySelector('.chat-title-bar-close');
    this.isChatDisplayed = false;
    this.isConnected = false;
    this.events();
  }

  // events
  events() {
    this.chatIcon.addEventListener('click', e => this.toggleChat());
    this.closeIcon.addEventListener('click', e => this.closeChat());
    this.chatForm.addEventListener('submit', e => {
      e.preventDefault();
      this.sendMessageToServer();
    });
  }

  sendMessageToServer() {
    this.socket.emit('chatMessageFromBrowser', {
      message: this.chatField.value
    });
    this.chatField.value = '';
    this.chatField.focus();
  }

  closeChat() {
    this.chatWrapper.classList.remove('chat--visible');
    this.isChatDisplayed = false;
  }

  openChat() {
    this.chatWrapper.classList.add('chat--visible');
    this.isChatDisplayed = true;
    this.openConnection();
  }

  toggleChat() {
    if (this.isChatDisplayed) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openConnection() {
    if (!this.isConnected) {
      this.socket = io();
      this.socket.on('chatMessageFromServer', data => {
        alert(data.message);
      });
      this.isConnected = true;
    }
  }

  // methods
  injectHTML() {
    this.chatWrapper.innerHTML = `<div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
      <div id="chat" class="chat-log"></div>
      <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
      </form>
      `;
  }
}

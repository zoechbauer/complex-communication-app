export default class Chat {
  constructor() {
    this.chatWrapper = document.querySelector('#chat-wrapper');
    this.chatIcon = document.querySelector('.header-chat-icon');
    this.injectHTML();
    this.closeIcon = document.querySelector('.chat-title-bar-close');
    this.isChatDisplayed = false;
    this.events();
  }

  // events
  events() {
    this.chatIcon.addEventListener('click', e => this.toggleChat());
    this.closeIcon.addEventListener('click', e => this.closeChat());
  }

  closeChat() {
    this.chatWrapper.classList.remove('chat--visible');
    this.isChatDisplayed = false;
  }

  toggleChat() {
    if (this.isChatDisplayed) {
      this.chatWrapper.classList.remove('chat--visible');
    } else {
      this.chatWrapper.classList.add('chat--visible');
    }
    this.isChatDisplayed = !this.isChatDisplayed;
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

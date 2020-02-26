export default class RegistrationForm {
  constructor() {
    this.allFields = document.querySelectorAll(
      '#registration-form .form-control'
    );
    this.insertValidationElements();
    this.username = document.querySelector('#username-register');
    this.username.previousValue = '';
    this.events();
  }

  //events
  events() {
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
  }

  // methods
  isDifferent(el, handler) {
    if (el.value !== el.previousValue) {
      handler.call(this);
    }
    el.previousValue = el.value;
  }

  usernameHandler() {
    alert('usernameHandler just ran');
  }

  insertValidationElements() {
    this.allFields.forEach(el => {
      el.insertAdjacentHTML(
        'afterend',
        '<p class="alert alert-danger small liveValidateMessage"></p>'
      );
    });
  }
}

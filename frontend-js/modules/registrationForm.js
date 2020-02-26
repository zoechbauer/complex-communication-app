import axios from 'axios';
export default class RegistrationForm {
  constructor() {
    this.WAIT_TIMER_IN_MS = 800;
    this.allFields = document.querySelectorAll(
      '#registration-form .form-control'
    );
    this.insertValidationElements();
    this.username = document.querySelector('#username-register');
    this.username.previousValue = '';
    this.email = document.querySelector('#email-register');
    this.email.previousValue = '';
    this.events();
  }

  //events
  events() {
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler);
    });
    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler);
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
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer);
    this.username.timer = setTimeout(
      () => this.usernameAfterDelay(),
      this.WAIT_TIMER_IN_MS
    );
  }

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(
      () => this.emailAfterDelay(),
      this.WAIT_TIMER_IN_MS
    );
  }

  usernameImmediately() {
    // check valid characters
    if (
      this.username.value != '' &&
      !/^([a-zA-Z0-9]+)$/.test(this.username.value)
    ) {
      this.showValidationError(
        this.username,
        'Username can only contain letters and numbers'
      );
    }
    // check max length
    if (this.username.value.length > 30) {
      this.showValidationError(
        this.username,
        'Username cannot exceed 30 characters'
      );
    }
    // hide validation errmsg if no errors
    if (!this.username.errors) {
      this.hideValidationError(this.username);
    }
  }

  usernameAfterDelay() {
    // check min length
    if (this.username.value.length < 3) {
      this.showValidationError(
        this.username,
        'Username must be at least 3 characters'
      );
    }

    // check if username already exist
    if (!this.username.errors) {
      axios
        .post('/doesUsernameExist', { username: this.username.value })
        .then(response => {
          if (response.data) {
            this.showValidationError(this.username, 'Username already exists');
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
          }
        })
        .catch(err => console.log(err));
    }
  }

  emailAfterDelay() {
    // valid data
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(
        this.email,
        'You must provide a valid email address'
      );
    }
    // check if email is already used
    if (!this.email.errors) {
      axios
        .post('/doesEmailExist', { email: this.email.value })
        .then(response => {
          if (response.data) {
            this.email.isUnique = false;
            this.showValidationError(
              this.email,
              'That email is already beeing used'
            );
          } else {
            this.email.isUnique = true;
            this.hideValidationError(this.email);
          }
        })
        .catch(err => console.log(err));
    }
  }

  hideValidationError(el) {
    el.nextElementSibling.classList.remove('liveValidateMessage--visible');
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message;
    el.nextElementSibling.classList.add('liveValidateMessage--visible');
    el.errors = true;
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

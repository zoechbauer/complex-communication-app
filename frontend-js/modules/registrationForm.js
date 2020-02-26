export default class RegistrationForm {
  constructor() {
    this.allFields = document.querySelectorAll(
      '#registration-form .form-control'
    );
    this.insertValidationElements();
    this.events();
  }

  //events
  events() {}

  // methods
  insertValidationElements() {
    this.allFields.forEach(el => {
      el.insertAdjacentHTML(
        'afterend',
        '<p class="alert alert-danger small liveValidateMessage liveValidateMessage--visible">Validation Message</p>'
      );
    });
  }
}

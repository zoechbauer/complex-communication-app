const validator = require('validator');
const usersCollection = require('../db').collection('users');
const minPwLen = 4; // for testing

let User = function(data) {
  this.data = data;
  this.errors = [];
};

User.prototype.cleanUp = function() {
  // accept only strings
  if (typeof this.data.username != 'string') {
    this.data.username = '';
  }
  if (typeof this.data.email != 'string') {
    this.data.email = '';
  }
  if (typeof this.data.password != 'string') {
    this.data.password = '';
  }

  // accept only defined properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  };
};

User.prototype.validate = function() {
  if (this.data.username == '') {
    this.errors.push('You must provide a username');
  }
  if (
    this.data.username != '' &&
    !validator.isAlphanumeric(this.data.username)
  ) {
    this.errors.push('Username can only contain letters and numbers');
  }
  if (!validator.isEmail(this.data.email)) {
    this.errors.push('You must provide a valid email address');
  }
  if (this.data.password == '') {
    this.errors.push('You must provide a password');
  }

  if (this.data.username.length > 0 && this.data.username.length < 3) {
    this.errors.push('Username must be at least 3 characters');
  }
  if (this.data.password.length > 0 && this.data.password.length < minPwLen) {
    this.errors.push(`Password must be at least ${minPwLen} characters`);
  }

  if (this.data.username.length > 30) {
    this.errors.push('Username must not exceed 30 characters');
  }
  if (this.data.password.length > 100) {
    this.errors.push('Password must not exceed 100 characters');
  }
};

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();

    usersCollection
      .findOne({ username: this.data.username })
      .then(mongoUser => {
        if (mongoUser && mongoUser.password == this.data.password) {
          resolve('congrats, you logged in');
        } else {
          reject('invalid username / password');
        }
      })
      .catch(() => reject('Please try again later'));
  });
};

User.prototype.register = function() {
  // step #1: validate user data
  this.cleanUp();
  this.validate();

  // step #2: if there are no validation errors then store user data in database
  if (!this.errors.length) {
    // console.log('insertOne', this.data);
    // console.log('usersCollection', usersCollection);
    usersCollection.insertOne(this.data);
  }
};

module.exports = User;

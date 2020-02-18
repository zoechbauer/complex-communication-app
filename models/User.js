const validator = require('validator');
const usersCollection = require('../db')
  .db()
  .collection('users');
const bcrypt = require('bcryptjs');
const md5 = require('md5');
const minPwLen = 4; // for testing
const maxPwLen = 50; // restricted by bcryptjs
const minUsernameLen = 3;
const maxUsernameLen = 30;

let User = function(data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
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
  return new Promise(async (resolve, reject) => {
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

    if (
      this.data.username.length > 0 &&
      this.data.username.length < minUsernameLen
    ) {
      this.errors.push(
        `Username must be at least ${minUsernameLen} characters`
      );
    }
    if (this.data.password.length > 0 && this.data.password.length < minPwLen) {
      this.errors.push(`Password must be at least ${minPwLen} characters`);
    }

    if (this.data.username.length > maxUsernameLen) {
      this.errors.push(`Username must not exceed ${maxUsernameLen} characters`);
    }
    if (this.data.password.length > maxPwLen) {
      this.errors.push(`Password must not exceed ${maxPwLen} characters`);
    }

    // only if username is valid then check if it's unique
    if (
      this.data.username.length >= minUsernameLen &&
      this.data.username.length <= maxUsernameLen &&
      validator.isAlphanumeric(this.data.username)
    ) {
      let userExist = await usersCollection.findOne({
        username: this.data.username
      });
      if (userExist) {
        this.errors.push('That username is already taken');
      }
    }

    // only if email is valid then check if it's unique
    if (validator.isEmail(this.data.email)) {
      let emailExist = await usersCollection.findOne({
        email: this.data.email
      });
      if (emailExist) {
        this.errors.push('That email is already being used');
      }
    }
    resolve();
  });
};

User.prototype.getAvatar = function() {
  // if avatar at gravatar.com is missing then a default avatar is delivered
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();

    usersCollection
      .findOne({ username: this.data.username })
      .then(mongoUser => {
        console.log('mongoUser', mongoUser);
        if (
          mongoUser &&
          bcrypt.compareSync(this.data.password, mongoUser.password)
        ) {
          this.data = mongoUser;
          this.getAvatar();
          resolve('congrats, you logged in');
        } else {
          reject('invalid username / password');
        }
      })
      .catch(() => reject('Please try again later'));
  });
};

User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    // step #1: validate user data
    this.cleanUp();
    await this.validate();

    // step #2: if there are no validation errors then store user data in database
    if (!this.errors.length) {
      // hash password
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      await usersCollection.insertOne(this.data);
      this.getAvatar();
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

User.findByUsername = function(username) {
  return new Promise((resolve, reject) => {
    if (typeof username != 'string') {
      reject('Wrong username');
      return;
    }

    usersCollection
      .findOne({ username: username })
      .then(userDoc => {
        if (userDoc) {
          let userProfile = new User(userDoc, true);
          userProfile = {
            _id: userProfile.data._id,
            username: userProfile.data.username,
            avatar: userProfile.avatar
          };
          resolve(userProfile);
        } else {
          reject('Userprofile does not exist.');
        }
      })
      .catch(err => {
        reject('Could not read database. Please try it later again.');
      });
  });
};

module.exports = User;

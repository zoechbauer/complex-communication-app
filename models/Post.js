const postsCollection = require('../db')
  .db()
  .collection('posts');

let Post = function(data) {
  this.data = data;
  this.errors = [];
  console.log('ctor', this.data);
};

Post.prototype.cleanUp = function() {
  console.log('cleanup');
  if (typeof this.data.title != 'string') {
    this.data.title = '';
  }

  if (typeof this.data.body != 'string') {
    this.data.body = '';
  }

  // get rid of unwanted properties
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date()
  };
};

Post.prototype.validate = function() {
  console.log('validate');
  if (this.data.title == '') {
    this.errors.push('You must provide a title');
  }

  if (this.data.body == '') {
    this.errors.push('You must provide post content');
  }
};

Post.prototype.create = function() {
  console.log('create');
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    console.log('before insert db: ', this.data);
    if (!this.errors.length) {
      // store post in database
      console.log('insert db: ', this.data);
      postsCollection
        .insertOne(this.data)
        .then(() => {
          resolve();
        })
        .catch(() => {
          this.errors.push('Please try again later');
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

module.exports = Post;

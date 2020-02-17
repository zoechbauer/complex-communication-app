const ObjectId = require('mongodb').ObjectID;
const postsCollection = require('../db')
  .db()
  .collection('posts');

let Post = function(data, userId) {
  this.data = data;
  this.userId = userId;
  this.errors = [];
};

Post.prototype.cleanUp = function() {
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
    createdDate: new Date(),
    Author: ObjectId(this.userId)
  };
};

Post.prototype.validate = function() {
  if (this.data.title == '') {
    this.errors.push('You must provide a title');
  }

  if (this.data.body == '') {
    this.errors.push('You must provide post content');
  }
};

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      // store post in database
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

// this is an example of using a function as property
// and not using the OO pattern
Post.findSingleById = function(id) {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectId.isValid(id)) {
      reject('Wrong id');
      return;
    }

    const post = await postsCollection.findOne({
      _id: new ObjectId(id)
    });
    if (post) {
      resolve(post);
    } else {
      reject('Post not found');
    }
  });
};

module.exports = Post;

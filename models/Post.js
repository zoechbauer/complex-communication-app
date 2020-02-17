const ObjectId = require('mongodb').ObjectID;
const postsCollection = require('../db')
  .db()
  .collection('posts');
const User = require('./User');

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
    author: ObjectId(this.userId)
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

    let posts = await postsCollection
      .aggregate([
        { $match: { _id: ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDocument'
          }
        },
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            author: { $arrayElemAt: ['$authorDocument', 0] }
          }
        }
      ])
      .toArray();

    // clean up author property in each object
    posts = posts.map(post => {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      };
      return post;
    });

    if (posts.length) {
      console.log('posts[0]', posts[0]);
      resolve(posts[0]);
    } else {
      reject('Post not found');
    }
  });
};

module.exports = Post;

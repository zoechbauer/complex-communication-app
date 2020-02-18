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

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
  return new Promise(async (resolve, reject) => {
    let aggregateOperations = uniqueOperations.concat([
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
          authorId: '$author',
          author: { $arrayElemAt: ['$authorDocument', 0] }
        }
      }
    ]);

    let posts = await postsCollection.aggregate(aggregateOperations).toArray();

    // clean up author property in each object
    posts = posts.map(post => {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      };
      return post;
    });
    resolve(posts);
    console.log('reusablePostQuery: resolve posts', posts);
  });
};

// this is an example of using a function as property
// and not using the OO pattern
Post.findSingleById = function(id, visitorId) {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectId.isValid(id)) {
      reject('Wrong id');
      return;
    }

    const posts = await Post.reusablePostQuery(
      [{ $match: { _id: ObjectId(id) } }],
      visitorId
    );

    if (posts.length) {
      resolve(posts[0]);
    } else {
      reject('Post not found');
    }
  });
};

Post.findByAuthorId = function(authorId) {
  return new Promise(async (resolve, reject) => {
    if (!ObjectId.isValid(authorId)) {
      reject('Wrong id');
      return;
    }

    const posts = await Post.reusablePostQuery([
      { $match: { author: ObjectId(authorId) } },
      { $sort: { createdDate: -1 } }
    ]);

    resolve(posts);
  });
};

// Brad's version
// Post.findByAuthorId = function(authorId) {
//   return Post.reusablePostQuery([
//     { $match: { author: authorId } },
//     { $sort: { createdDate: -1 } }
//   ]);
// };

module.exports = Post;

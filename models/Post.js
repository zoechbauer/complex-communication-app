const ObjectID = require('mongodb').ObjectID;
const postsCollection = require('../db')
  .db()
  .collection('posts');
const User = require('./User');
const sanitizeHTML = require('sanitize-html');

let Post = function(data, userId, requestedPostId) {
  this.data = data;
  this.userId = userId;
  this.requestedPostId = requestedPostId;
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
  // get rid of any bogus properties
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }),
    body: sanitizeHTML(this.data.body.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }),
    createdDate: new Date(),
    author: ObjectID(this.userId)
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
        .then(info => {
          console.log('mongodb-create.ops', info.ops[0]);
          resolve(info.ops[0]._id);
        })
        .catch(err => {
          console.log('db-error', err);
          this.errors.push('Please try again later');
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userId);
      if (post.isVisitorOwner) {
        let status = await this.updateDatabase();
        resolve(status);
      } else {
        reject('not owner of post');
      }
    } catch (error) {
      reject(error);
    }
  });
};

Post.prototype.updateDatabase = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();

    try {
      if (!this.errors.length) {
        await postsCollection.findOneAndUpdate(
          { _id: new ObjectID(this.requestedPostId) },
          { $set: { title: this.data.title, body: this.data.body } }
        );
        resolve('success');
      } else {
        resolve('validation errors');
      }
    } catch (error) {
      this.errors.push(error);
      console.log('ERROR in updateDatabase: ', error);
      reject('error');
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
      post.authorId = undefined;
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      };
      return post;
    });
    resolve(posts);
  });
};

// this is an example of using a function as property
// and not using the OO pattern
Post.findSingleById = function(id, visitorId) {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject('Wrong id');
      return;
    }

    const posts = await Post.reusablePostQuery(
      [{ $match: { _id: new ObjectID(id) } }],
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
    if (!ObjectID.isValid(authorId)) {
      reject('Wrong id');
      return;
    }

    const posts = await Post.reusablePostQuery([
      { $match: { author: ObjectID(authorId) } },
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

Post.delete = function(postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: new ObjectID(postIdToDelete) });
        resolve('success');
      } else {
        reject('not VisitorOwner');
      }
    } catch (error) {
      reject('post not found');
    }
  });
};

Post.search = searchTerm => {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof searchTerm == 'string') {
        let posts = await Post.reusablePostQuery([
          { $match: { $text: { $search: searchTerm } } },
          { $sort: { score: { $meta: 'textScore' } } }
        ]);
        resolve(posts);
      } else {
        reject('wrong type of searchTerm');
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = Post;

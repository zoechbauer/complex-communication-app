const usersCollection = require('../db')
  .db()
  .collection('users');
const followsCollection = require('../db')
  .db()
  .collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

let Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = function() {
  if (typeof this.followedUsername != 'string') {
    this.followedUsername = '';
  }
};

Follow.prototype.validate = async function(action) {
  // followed user must exist in database
  const followedAccount = await usersCollection.findOne({
    username: this.followedUsername
  });
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push('You cannot follow a user that does not exist');
  }

  // action: create or delete
  const followingExists = await Follow.isVisitorFollowing(
    this.followedId,
    this.authorId
  );
  if (action == 'create' && followingExists) {
    this.errors.push('You are already following this user');
  }

  if (action == 'delete' && !followingExists) {
    this.errors.push(
      'You cannot stop following someone you do not already follow'
    );
  }

  // you cannot follow yourself
  if (this.followedId.equals(this.authorId)) {
    this.errors.push('You cannot follow yourself');
  }
};

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate('create');
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId)
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate('delete');
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId)
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.isVisitorFollowing = async function(followedId, visitorId) {
  const followDoc = await followsCollection.findOne({
    followedId: followedId,
    authorId: new ObjectID(visitorId)
  });
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowersById = id => {
  return new Promise(async (resolve, reject) => {
    try {
      // aggregate username & email from follows
      const aggregateFunction = [
        { $match: { followedId: id } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        {
          $project: {
            username: { $arrayElemAt: ['$userDoc.username', 0] },
            email: { $arrayElemAt: ['$userDoc.email', 0] }
          }
        }
      ];
      // get aggregate data from followers
      const followers = await followsCollection
        .aggregate(aggregateFunction)
        .toArray();
      // get avatar from email
      const followersMapped = followers.map(follower => {
        const user = new User(follower, true);
        return {
          username: follower.username,
          avatar: user.avatar
        };
      });
      resolve(followersMapped);
      // error
    } catch (error) {
      reject(error);
    }
  });
};

Follow.getFollowingById = id => {
  return new Promise(async (resolve, reject) => {
    try {
      // aggregate username & email from follows
      const aggregateFunction = [
        { $match: { authorId: id } },
        {
          $lookup: {
            from: 'users',
            localField: 'followedId',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        {
          $project: {
            username: { $arrayElemAt: ['$userDoc.username', 0] },
            email: { $arrayElemAt: ['$userDoc.email', 0] }
          }
        }
      ];
      // get aggregate data from followers
      const followers = await followsCollection
        .aggregate(aggregateFunction)
        .toArray();
      // get avatar from email
      const followersMapped = followers.map(follower => {
        const user = new User(follower, true);
        return {
          username: follower.username,
          avatar: user.avatar
        };
      });
      resolve(followersMapped);
      // error
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = Follow;

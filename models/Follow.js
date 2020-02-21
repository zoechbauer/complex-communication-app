let Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = () => {};

Follow.prototype.validate = () => {};

Follow.prototype.create = () => {};

module.exports = Follow;

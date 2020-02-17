const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {
  res.render('create-post');
};

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(() => {
      res.send('Post stored in database');
    })
    .catch(err => {
      res.send('error in postController.create: ' + err);
    });
};

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id);
    console.log('post', post);
    res.render('single-post-screen', {
      post: post
    });
  } catch (error) {
    res.send('error: ' + error);
  }
};

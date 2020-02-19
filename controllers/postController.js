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
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render('single-post-screen', {
      post: post
    });
  } catch (error) {
    res.render('404');
  }
};

exports.viewEditScreen = async (req, res) => {
  try {
    const post = await Post.findSingleById(req.params.id);
    res.render('edit-post', { post: post });
  } catch (error) {
    console.log('ERROR in view EditScreen: ', error);
    res.render(404);
  }
};

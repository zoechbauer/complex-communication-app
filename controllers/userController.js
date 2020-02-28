const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const jwt = require('jsonwebtoken');

exports.sharedProfileData = async function(req, res, next) {
  let isFollowing = false;
  let isVisitorProfile = false;

  if (req.session.user) {
    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId
    );

    isVisitorProfile =
      req.profileUser._id == req.session.user._id ? true : false;
  }
  req.isFollowing = isFollowing;
  req.isVisitorProfile = isVisitorProfile;

  // retrieve posts, followers, and following counts
  const postsCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  const followersCountPromise = Follow.countFollowersById(req.profileUser._id);
  const followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  let [postsCount, followersCount, followingCount] = await Promise.all([
    postsCountPromise,
    followersCountPromise,
    followingCountPromise
  ]);
  req.postsCount = postsCount;
  req.followersCount = followersCount;
  req.followingCount = followingCount;

  next();
};

exports.doesUsernameExist = function(req, res) {
  User.findByUsername(req.body.username)
    .then(() => res.json(true))
    .catch(() => res.json(false));
};

exports.doesEmailExist = async function(req, res) {
  const emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

exports.apiMustBeLoggedIn = (req, res, next) => {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch (error) {
    res.json('Sorry, you must provide a valid token');
  }
};

exports.mustBeLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('errors', 'You must be logged in to perform that action');
    req.session.save(callback => res.redirect('/'));
  }
};

exports.login = function(req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id
      };
      // although the above stmt would store the session in db automatically
      // we store it manually in db to use a callback for redirect to home
      // see https://github.com/expressjs/session
      req.session.save(callback => {
        res.redirect('/');
      });
    })
    .catch(err => {
      // store error msg in session cookie in db
      req.flash(err);
      res.redirect('/');
    });
};

exports.apiLogin = function(req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(result => {
      console.log('user.data', user.data);
      res.json(
        jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, {
          expiresIn: '7d'
        })
      );
    })
    .catch(err => {
      console.log(err);
      res.json('sorry, wrong username or password');
    });
};

exports.logout = function(req, res) {
  // delete session cookie in database
  req.session.destroy(callback => {
    //display homepage as anonymous user after logged out
    res.redirect('/');
  });
};

exports.register = (req, res) => {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id
      };
      req.session.save(callback => res.redirect('/'));
    })
    .catch(errors => {
      errors.forEach(error => req.flash('regErrors', error));
      req.session.save(callback => res.redirect('/'));
    });
};

exports.home = async (req, res) => {
  if (req.session.user) {
    const posts = await Post.getFeed(req.session.user._id);
    res.render('home-dashboard', {
      posts: posts,
      title: `Home ${req.session.user.username}`
    });
  } else {
    // display error message and clear it from db-cookie
    res.render('home-guest', {
      regErrors: req.flash('regErrors'),
      title: 'Home Guest'
    });
  }
};

exports.ifUserExists = function(req, res, next) {
  User.findByUsername(req.params.username)
    .then(userDoc => {
      req.profileUser = userDoc;
      next();
    })
    .catch(err => {
      console.log(err);
      res.render('404', { title: 'ERROR' });
    });
};

exports.profilePostsScreen = function(req, res) {
  // get all posts of a certain author id
  Post.findByAuthorId(req.profileUser._id)
    .then(posts => {
      // expose only the needed properties
      res.render('profile', {
        title: `Profile Posts for ${req.profileUser.username}`,
        currentPage: 'posts',
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorProfile: req.isVisitorProfile,
        counts: {
          postsCount: req.postsCount,
          followersCount: req.followersCount,
          followingCount: req.followingCount
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.render('404', { title: 'ERROR' });
    });
};

exports.profileFollowersScreen = async function(req, res) {
  try {
    const followers = await Follow.getFollowersById(req.profileUser._id);
    res.render('profile-followers', {
      title: `Profile Follower for ${req.profileUser.username}`,
      currentPage: 'followers',
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount
      }
    });
  } catch (err) {
    console.log(err);
    res.render('404', { title: 'ERROR' });
  }
};

exports.profileFollowingScreen = async function(req, res) {
  try {
    const following = await Follow.getFollowingById(req.profileUser._id);
    res.render('profile-following', {
      title: `Profile Following for ${req.profileUser.username}`,
      currentPage: 'following',
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount
      }
    });
  } catch (err) {
    console.log(err);
    res.render('404', { title: 'ERROR' });
  }
};

exports.apiGetPostsByUsername = async (req, res) => {
  try {
    const authorDoc = await User.findByUsername(req.params.username);
    const posts = await Post.findByAuthorId(authorDoc._id);
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.json('Sorry, this username does not exist');
  }
};

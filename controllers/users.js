const User = require('../models/user');
const Campground = require("../models/campground");

module.exports.renderRegisterForm = (req, res) => {
  res.render('users/register');
};

module.exports.register = async (req, res, next) => {
  try {
    const {
      email,
      username,
      password,
      adminCode,
      firstName,
      lastName,
      avatar,
    } = req.body;

    const user = new User({ email, username, firstName, lastName, avatar });
    //Admin check
    if (adminCode === process.env.ADMIN_PASS) {
      user.isAdmin = true;
    }

    const registeredUser = await User.register(user, password);
    // console.log(registeredUser);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
    });
    req.flash('success', 'Welcome to Yelp Camp! Login in to get started.');
    res.redirect('/campgrounds');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
};

module.exports.renderLogin = (req, res) => {
  res.render('users/login');
};

module.exports.login = (req, res) => {
  const { username } = req.body;
  req.flash('success', `Welcome back, ${username}!`);
  //redirecting to requested route before login or else...
  const redirectUrl = req.session.returnTo || '/campgrounds';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Goodbye, young Skywalker!');
    res.redirect('/campgrounds');
  });
};

//User Profile
module.exports.userProfile = async (req, res) =>  {
  const user = await User.findById(req.params.id)

  if(!user) {
    req.flash('error', 'Something went wrong!')
    return res.redirect('/campgrounds')
  }
  const campgrounds = await Campground.find({owner: `${user._id}`})

  res.render('users/showProfile', {user, campgrounds})
};

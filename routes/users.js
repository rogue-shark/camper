const express = require('express');
const router = express.Router();
const User = require('../models/user');
const catchAsyncError = require('../Utilities/catchAsyncError');
const { isLoggedIn, isOwner} = require('../middleware');
const passport = require('passport');

//from CONTROLLER
const users = require('../controllers/users');

router.route('/register')
  .get(users.renderRegisterForm)
  .post(catchAsyncError(users.register));

router.route('/login')
  .get(users.renderLogin)
  .post(
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    users.login
  );

router.get('/logout', users.logout);

router.get('/users/:id', isLoggedIn , catchAsyncError(users.userProfile));  //Feature: isOwner

module.exports = router;

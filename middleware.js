const { campgroundSchema, reviewSchema } = require('./joiValidationSchemas.js'); //schema (NOTE: JOI schema not the default mongoose one)
const ExpressError = require('./Utilities/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');
const User = require('./models/user')

module.exports.isLoggedIn = (req, res, next) => {
  req.session.returnTo = req.originalUrl; 
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be signed in');
    return res.redirect('/login');
  }
  next();
};

//defining Joi validation middleware
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((ele) => ele.message).join(',');
    throw new ExpressError(msg, 400); //passed down to app.use error handler at the end
  } else {
    next();
  }
};

//middleware to protect out back-end routes so that someone can't even send a request using something like postman/axios/manually accessing the url etc.
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  const userProfile = await User.findById(id)
  
  if (campground !=null && (campground.owner.equals(req.user._id)  || req.user.isAdmin)) {
    next();
  } else if (campground == null && userProfile.equals(req.user._id)) {
    next()
  } else {
    req.flash('error', 'You do not have permission to do that');
    return res.redirect(`/campgrounds/${id}`);
  }
};

//defining Joi validation middleware
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isReviewOwner = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!req.user.isAdmin && !review.owner.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that');
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

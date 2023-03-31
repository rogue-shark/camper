const Review = require('../models/review');
const Campground = require('../models/campground');

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review);
  review.owner = req.user._id;
  campground.reviews.push(review);
  await review.save();
  await campground.save();
  req.flash('success', 'Created a new review!');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  //https://www.mongodb.com/docs/manual/reference/operator/update/pull/#-pull  -- removing the specific id from the reviewId array stored in a particular campground
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  //   await Review.findByIdAndDelete(reviewId);
  await Review.findByIdAndRemove(reviewId);
  req.flash('success', 'Review deleted!');
  res.redirect(`/campgrounds/${id}`);
};

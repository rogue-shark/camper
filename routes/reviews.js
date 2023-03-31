const express = require('express')
const router = express.Router( {mergeParams: true} ) //mergeParams - getting access to id
const { validateReview, isLoggedIn, isReviewOwner } = require('../middleware')
const catchAsyncError = require('../Utilities/catchAsyncError');
const ExpressError = require('../Utilities/ExpressError')

const Campground = require('../models/campground'); //importing from campground.js
const Review = require('../models/review')

const { reviewSchema } = require('../joiValidationSchemas.js') 

//from CONTROLLER
const reviews = require('../controllers/reviews')

//6. Routes for Review - model
router.post('/', isLoggedIn, validateReview, catchAsyncError( reviews.createReview ))

router.delete('/:reviewId', isLoggedIn, isReviewOwner, catchAsyncError( reviews.deleteReview ))

module.exports = router;
const express = require('express');
const router = express.Router();

const catchAsyncError = require('../Utilities/catchAsyncError');

const Campground = require('../models/campground');

const { isLoggedIn, isOwner, validateCampground } = require('../middleware');

//from - CONTROLLERS
const campgrounds = require('../controllers/campgrounds');

//cloudinary / multer
const multer = require('multer');

const { storage } = require('../cloudinary');
const upload = multer({ storage }); 

// 1. show  campgrounds (random 50)
router
  .route('/')
  .get(catchAsyncError(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array('image'),
    validateCampground,
    catchAsyncError(campgrounds.createCamp)
  );


//2. New and create
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

//SEARCH route
router.get('/search_result', campgrounds.searchResults) 

//RESTRUCTURING ROUTES
router.route('/:id')
  .get(catchAsyncError(campgrounds.showCamp))
  .put(
    isLoggedIn,
    isOwner,
    upload.array('image'),
    validateCampground,
    catchAsyncError(campgrounds.updateCamp)
  )
  .delete(isLoggedIn, isOwner, catchAsyncError(campgrounds.deleteCamp));

// Campground Like Route
router.post('/:id/like', isLoggedIn, campgrounds.likes);

router.get(
  '/:id/edit',
  isLoggedIn,
  isOwner,
  catchAsyncError(campgrounds.renderEditForm)
);


module.exports = router;

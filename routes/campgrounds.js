const express = require('express');
const router = express.Router();

const catchAsyncError = require('../Utilities/catchAsyncError');
// const ExpressError = require('../Utilities/ExpressError')

const Campground = require('../models/campground');

const { isLoggedIn, isOwner, validateCampground } = require('../middleware');
// const { findById } = require('../models/campground');

//from - CONTROLLERS
const campgrounds = require('../controllers/campgrounds');

//cloudinary / multer
//https://www.npmjs.com/package/multer
const multer = require('multer');
// const upload = multer({ dest: '/uploads' }) //ie. local storage in uploads folder
const { storage } = require('../cloudinary'); //since node directly looks for index file - so need need to specify here
const upload = multer({ storage }); //now stores using "storage" that we made

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

/*//1. show individual campground
router.get('/:id', catchAsyncError( campgrounds.showCamp ))

//3. Edit and update
router.get('/:id/edit', isLoggedIn, isOwner, catchAsyncError( campgrounds.renderEditForm ))

router.put('/:id', isLoggedIn, isOwner, validateCampground, catchAsyncError( campgrounds.updateCamp ))

//4. Delete
router.delete('/:id', isLoggedIn, isOwner, catchAsyncError( campgrounds.deleteCamp ))
*/

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

const Campground = require('../models/campground');
//MapBox - geocoding
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mbxToken = process.env.MAPBOX_TOKEN;
const mbxGeocoder = mbxGeocoding({ accessToken: mbxToken });

//requiring cloudinary - for deleting images from account
const { cloudinary } = require('../cloudinary');

module.exports.index = async (req, res, next) => {
  //PAGINATION
  const campgrounds = await Campground.paginate(
    {},
    {
      page: req.query.page || 1,
      limit: 10,
      sort: "-_id",
    }
  );
  campgrounds.page = Number(campgrounds.page);
  let totalPages = campgrounds.totalPages;
  let currentPage = campgrounds.page;
  let startPage;
  let endPage;

  if (totalPages <= 10) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= 6) {
      startPage = 1;
      endPage = 10;
    } else if (currentPage + 4 >= totalPages) {
      startPage = totalPages - 9;
      endPage = totalPages;
    } else {
      startPage = currentPage - 5;
      endPage = currentPage + 4;
    }
  }
  res.render("campgrounds/index", {
    campgrounds,
    startPage,
    endPage,
    currentPage,
    totalPages,
  });

};

module.exports.searchResults = async (req, res, next) => {
  //search camps

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all campgrounds from DB
    Campground.find({ title: regex } , function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        if (allCampgrounds.length < 1) {
          req.flash(
            'error',
            'No campgrounds match that query, please try again.'
          );
          res.redirect('/campgrounds');
        }
        res.render('campgrounds/searchResults', {
          campgrounds: allCampgrounds,
        });
      }
    });
  } 
}

module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new');
};

module.exports.createCamp = async (req, res, next) => {
  //from MapBox f/w geocoder --> we need "geoData.body.features[0].geometry.coordinates"
  const geoData = await mbxGeocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();

  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  })); 
  campground.owner = req.user._id; 
  await campground.save();
  console.log(campground);
  req.flash('success', 'Successfully made a campground!');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCamp = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'owner',
      },
    })
    .populate('owner')
    .populate('likes');
  if (!campground) {
    req.flash('error', 'Cannot find that campground');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/show', { campground });
};

//LIKES
module.exports.likes = async (req, res) => {
  Campground.findById(req.params.id, function (err, foundCampground) {
    if (err) {
      return res.redirect('/campgrounds');
    }

    // check if req.user._id exists in foundCampground.likes
    let foundUserLike = foundCampground.likes.some(function (like) {
      return like.equals(req.user._id);
    });

    if (foundUserLike) {
      // user already liked, removing like
      foundCampground.likes.pull(req.user._id);
    } else {
      // adding the new user like
      foundCampground.likes.push(req.user);
    }

    foundCampground.save(function (err) {
      if (err) {
        // console.log(err);
        return res.redirect('/campgrounds');
      }
      return res.redirect('/campgrounds/' + foundCampground._id);
    });
  });
};

//EDIT
module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    req.flash('error', 'Cannot find requested campground');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/edit', { campground });
};

//UPDATE
module.exports.updateCamp = async (req, res) => {
  const { id } = req.params;
  const camp = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  camp.images.push(...imgs);
  await camp.save();

  //deleting images from back end server & cloudinary
  if (req.body.deleteImages) {
    //1. Cloudinary
    //looping to delete from cludinary account - using "destroy"
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    //2. Server
    //i.e. pull from the "images" array - with 'filename' if that image 'in' 'req.body.deleteImages'
    await camp.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }

  req.flash('success', 'Successfully updated campground!');
  res.redirect(`/campgrounds/${camp._id}`);
};

//DELETE
module.exports.deleteCamp = async (req, res) => {
  const { id } = req.params;

  await Campground.findByIdAndDelete(id);
  req.flash('success', 'Campground deleted!');
  res.redirect('/campgrounds');
};

//for fuzzy search
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

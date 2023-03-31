//accessing .env file i.e when we are in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const session = require("express-session");
const MongoDBStore = require('connect-mongo');
const methodOverride = require("method-override");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require('helmet')

const ejsMate = require("ejs-mate"); //engine (ejs-mate)
app.engine("ejs", ejsMate);

const flash = require("connect-flash");

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");

//utilities > custom error handlers
/* MOVED TO ROUTES -> const catchAsyncError = require('./Utilities/catchAsyncError'); */
const ExpressError = require("./Utilities/ExpressError");

const Joi = require("joi");

//Schema
const { campgroundSchema, reviewSchema } = require("./joiValidationSchemas.js");

//Requiring Models:
const Campground = require("./models/campground"); //importing from campground.js
const Review = require("./models/review");

//Requiring Routes:
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
// const { serializeUser } = require('passport');
const userRoutes = require("./routes/users");

//to add creation time
app.locals.moment = require("moment");

//mongoDB connect and error handling
const dbURL = process.env.DB_URL
// const dbURL = 'mongodb://127.0.0.1/yelp-camp-test'
mongoose.connect(dbURL); //can add -> { useNewUrlParser: true, userCreateIndex: true, useUnifiedTopology: true }
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error!!! :"));
db.once("open", () => {
  console.log("Ayo, Database CONNECTED!");
});
/* OR
.then(() => {
    console.log('Ayo, database CONNECTED!')
})
.catch(e => {
    console.log(e, 'opps, error!!!!')
}) */

//setting views dir and path
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //will render from views folder

//parsing req.body - https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded
app.use(express.urlencoded({ extended: true }));
//to use all kinds of http methods
app.use(methodOverride("_method"));
//public dir
app.use(express.static(path.join(__dirname, "public")));
//to prevent mongoDB injection - https://www.npmjs.com/package/express-mongo-sanitize
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
//express-session
const store = new MongoDBStore({
    mongoUrl: dbURL,
    secret,
    touchAfter: 24 * 3600
})

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e)
})

const sessionConfig = {
  store,
  name: 'session', //changing from default (connect.sid)
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,

    // so that cookies can only be configured/accessed over https requests
        //we need it when we deploy the application
    // secure: true,

    //Date.now() - in ms
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //after a week
    maxAge: 1000 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(helmet({contentSecurityPolicy: false}))

/* RECOMMENDED way:
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);
*/


//auth - PASSPORT
//NOTE: must come before local variables i.e. res.locals
app.use(passport.initialize());
app.use(passport.session()); // read passport documentation
passport.use(new localStrategy(User.authenticate())); //authenticate is 'static' method added by passport
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//connect-flash
app.use(flash());
//creating middlewqre
app.use((req, res, next) => {
  //https://www.geeksforgeeks.org/express-js-res-locals-property/
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

/* MOVED TO ROUTES 
//defining Joi validation middleware
const validateCampground = (req, res, next) => {
        //Using Joi - validated even before express | Server side validation
        // const campgroundSchema = Joi.object({
        //     campground: Joi.object({
        //         title: Joi.string().required(),
        //         price: Joi.number().required().min(0),
        //         image: Joi.string().required(),
        //         location: Joi.string().required(),
        //         description: Joi.string().required()
        //     }).required()
        // })   
        //once we have our schema defined(above) -- all we have to do is pass our data through to the schema i.e. -
        const { error } = campgroundSchema.validate(req.body)
        if(error){
            //mapping over error.details to make a single string message
            const msg = error.details.map(ele => ele.message).join(',')
            throw new ExpressError(msg, 400) //passed down to app.use error handler at the end
        } else{
            next()
        }
        // console.log(result)
}*/

/*const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}*/

/*-------------------------------------------------------------------------------------------------------*/
//0. test - Home
app.get("/", (req, res) => {
  res.render("home");
});

//using Routes
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

/* OR
app.use((req, res) => {
   res.send("<h1>You're home! And wanted.</h1>")
}) */

/*MOVED TO ROUTES - campgrounds.js
// 1. show  campgrounds (random 50)
app.get('/campgrounds', catchAsyncError( async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
}) )

//2. New and create
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new')
})

app.post('/campgrounds', validateCampground, catchAsyncError( async(req, res, next) => {
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
    //Using Joi - validated even before express | Server side validation

    // res.send(req.body) --> we need to parse this data using middleware (urlencoded) 
    //                        So, now we post data as (json) -> {"campground":{"title":"edds","location":"csc"}} 
    //                                            Now, we can use this object by extracting its values
      const campground = new Campground(req.body.campground)
      await campground.save()
      res.redirect(`/campgrounds/${campground._id}`)
}))


//1. show individual campground
app.get('/campgrounds/:id', catchAsyncError( async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews')
    res.render('campgrounds/show', { campground })
}) )

//3. Edit and update
app.get('/campgrounds/:id/edit', catchAsyncError( async (req,res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', { campground })
}) )

app.put('/campgrounds/:id', validateCampground, catchAsyncError( async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${campground._id}`)
}) )

//4. Delete
app.delete('/campgrounds/:id', catchAsyncError( async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    res.redirect('/campgrounds')
}) )
*/

/*MoVED TO ROUTES - review.js
//6. Routes for Review - model
app.post('/campgrounds/:id/reviews', validateReview, catchAsyncError(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsyncError(async (req, res) => {
    const { id, reviewId } = req.params;
    //https://www.mongodb.com/docs/manual/reference/operator/update/pull/#-pull  -- removing the specific id from the reviewId array stored in a particular campground
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))
*/

//5.error handling
//for every other route for which the error hasn't been handled (i.e universal handler)
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  //destructuring statusCode & message from err object
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, something went wrong!!";
  //from .all - new ExpressError
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("LISTENING TO PORT: 3000");
});

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

const ejsMate = require("ejs-mate"); 
app.engine("ejs", ejsMate);

const flash = require("connect-flash");

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");

//utilities > custom error handlers
const ExpressError = require("./Utilities/ExpressError");

//Requiring Routes:
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

const userRoutes = require("./routes/users");

//to add creation time
app.locals.moment = require("moment");

//mongoDB connect and error handling
const dbURL = process.env.DB_URL
// const dbURL = 'mongodb://127.0.0.1/yelp-camp-test'
mongoose.connect(dbURL); 
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error!!! :"));
db.once("open", () => {
  console.log("Ayo, Database CONNECTED!");
});

//setting views dir and path
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
    //Date.now() - in ms
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //after a week
    maxAge: 1000 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(helmet({contentSecurityPolicy: false}))


//auth - PASSPORT
//NOTE: must come before local variables i.e. res.locals
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//connect-flash
app.use(flash());
//creating middlewqre
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});


//0. test - Home
app.get("/", (req, res) => {
  res.render("home");
});

//using Routes
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

//for every other route for which the error hasn't been handled (i.e universal handler)
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, something went wrong!!";
  //from .all - new ExpressError
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("LISTENING TO PORT: 3000");
});

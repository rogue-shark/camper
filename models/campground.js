//campground model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const mongoosePaginate = require('mongoose-paginate-v2');

/*
//To Show uploaded images on show page as thumbnails
//Creating mongoose Schema virtual property
const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});  
NOTE: Using thumbnail by replacing img.url to img.thumbnail in edit.ejs 
*/

//https://mongoosejs.com/docs/tutorials/virtuals.html#virtuals-in-json:~:text=%3B%20//%20%27Picard%27-,Virtuals%20in%20JSON,-By%20default%2C%20Mongoose
const opts = { toJSON: { virtuals: true } };

/* new instance of Schema (constructor function)
 i.e. naming that instance CampgroundSchema */
const CampgroundSchema = new Schema(
  {
    title: String,
    createdAt: { type: Date, default: Date.now },
    price: Number,
    description: String,
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      //MapBox:
      // GeoJSON- https://mongoosejs.com/docs/geojson.html
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    location: String,
    // image: String,
    images: [
      {
        url: String,
        filename: String,
      },
    ],
    //authorization (after authentication)
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    //linking review model -> One-to-Many relation i.e. storing each reviewID under a campground as an array
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  opts
);

//making a virtual property called "properties" as MapBox (for Clusters) expects this prop in its data
//making such that whenever we click on a point on map it pops up a link to that camp
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>`;
});

//deleting associated reviews
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        //https://www.mongodb.com/docs/manual/reference/operator/query/in/
        $in: doc.reviews,
      },
    });
  }
});


CampgroundSchema.plugin(mongoosePaginate);
//each campground will be modelled after the defined schema
const cgModel = mongoose.model('Campground', CampgroundSchema);

module.exports = cgModel; //exporting to use in app.js

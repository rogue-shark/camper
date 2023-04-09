//campground model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const mongoosePaginate = require('mongoose-paginate-v2');

const opts = { toJSON: { virtuals: true } };

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
    images: [
      {
        url: String,
        filename: String,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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

const cgModel = mongoose.model('Campground', CampgroundSchema);

module.exports = cgModel; 

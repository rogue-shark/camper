if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
//doing this we can separately access our DB (this file)
const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

const dbURL = process.env.DB_URL;
// 'mongodb://127.0.0.1/yelp-camp-test'
mongoose.connect(dbURL);  

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error!!! :')) 
db.once('open', () => {
    console.log('Database CONNECTED!')
    console.log('random 50 campgrounds created!')
})

const sample = array => array[Math.floor(Math.random() * array.length)]


const seedDB = async () => {
    await Campground.deleteMany({})
    for (let i=0; i< 25; i++){
        const random1000 = Math.floor(Math.random() * 400)
        const price = Math.floor(Math.random()*20) + 10
        const camp = new Campground({
            owner: '6426b92b97e22211bd66f019',
            // image: 'https://placeimg.com/640/480/nature',
            // or https://source.unsplash.com/collection/483251
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point",
                //using [lng,lat] format b/c of MapBox
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Proin sed mi est. Quisque maximus arcu eros, at rhoncus erat vestibulum nec. Donec erat magna, bibendum et eros id, porttitor placerat turpis. Praesent ullamcorper est ac mauris blandit ornare. Curabitur sit amet congue diam. Donec malesuada ligula ut dui consequat, ac tincidunt orci tempor. Curabitur vestibulum massa tortor, id semper lacus consequat eget.',
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dsdsmxmd3/image/upload/v1673281999/YelpCamp-proto/tegan-mierle-fDostElVhN8-unsplash_vdusfn.jpg',
                    filename: 'YelpCamp-proto/tegan-mierle-fDostElVhN8-unsplash_vdusfn.jpg'
                },
                {
                    url: 'https://res.cloudinary.com/dsdsmxmd3/image/upload/v1673282441/YelpCamp-proto/chris-holder-uY2UIyO5o5c-unsplash_nxecox.jpg',
                    filename: 'YelpCamp-proto/chris-holder-uY2UIyO5o5c-unsplash_nxecox.jpg'
                }
            ]
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close() //closing connection
})


const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//specifying our credentials 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
    //associates our account with the cloudinary instance
});

//instantiating CloudinaryStorage   
    //https://www.npmjs.com/package/multer-storage-cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'YelpCamp-proto',
         allowedFormats : ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
}


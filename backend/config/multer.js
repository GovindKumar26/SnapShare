const multer = require('multer');
const cloudinary = require('./cloudinary')
const {CloudinaryStorage} = require('multer-storage-cloudinary')

// const storage = multer.diskStorage({
//     destination : function(req, file, cb){
//         cb(null, "./upload");
//     },

//     filename : function(req, file, cb){
//         const fileName = file.originalname;
//         cb(null, fileName);
//     }
// })

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params : {
        folder : "avatars",
        allowed_formats : ['jpg', 'png', 'jpeg'],
        public_id : (req, file)=> Date.now() + "-" + file.originalname,
    }

})



// const upload = multer({storage});

const upload  = multer({storage});

module.exports = upload;
const express = require('express');
const dotenv = require('dotenv')
dotenv.config();
const cookieParser = require('cookie-parser');

const dbConnect = require('./config/db.js');
const register = require('./controller/register.js');




const upload = require('./config/multer.js');
const verifyToken = require('./middleware/verifyToken.js');
const logout = require('./controller/logout.js');
const login = require('./controller/login.js');
const app = express();

app.use(cookieParser());



// dbConnect()

// serving from local folder app.use('/avatarImage', express.static('upload')); // in case if a request url is of avatarImage, look for files in the upload folder and serve it
app.use(express.json({limit : '100kb'}));

app.get('/', (req, res) => {
    // res.json({ message: "Hello World" }); // res.json to send json response
    res.send("Hello world"); // res.send is used to send general purpose response, can send any kind - string, object, html, buffer. express will try to guess the content type automatically

})



app.post('/register', upload.single("avatar"), register);

app.post('/login', login);
app.post('/logout', logout);



// const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');

//app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/likes', likeRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/follows', followRoutes);



const PORT = process.env.PORT || 3000;

// Connect to DB first, then start server
dbConnect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running on PORT ${PORT}`);
            
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err);
        process.exit(1); // Exit process on failure
    });
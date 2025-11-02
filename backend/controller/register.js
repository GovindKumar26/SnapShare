const User = require("../models/User");
const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/demo/image/upload/v1234567890/default-avatar.png";

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary')

const generateTokens = (createdUser)=>{
  const accessToken = jwt.sign(
            { id: createdUser._id, username: createdUser.username, email: createdUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { id: createdUser._id, username: createdUser.username, email: createdUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return {accessToken, refreshToken};
}


const register = async (req, res) => {
    try {
        const {password, displayName } = req.body;
        const username = (req.body.username || '').trim();
        const email = (req.body.email || '').trim();

        // Basic validation
        if (!username || !email || !password || !displayName) {
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        let avatarFile = req.file;
        //  console.log(req.file);

       const avatarUrl = req.file ? req.file.path : DEFAULT_AVATAR_URL;

      //  const avatarPublicId = req.file ? req.file.filename : "";
        const avatarPublicId = req.file ? req.file.filename : null;

        let { bio: rawBio } = req.body;
        if (!rawBio || rawBio.trim() === "") {
            rawBio = "Hi, I'm using SnapShare!"; 
        }


        console.log("avatar is", avatarFile);


        // const checkUser = await User.findOne({username});
        // const checkUser = await User.findOne({email});

        // check both username or email
        const checkUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (checkUser) {
            console.log("User already exists");
            //  Cleanup uploaded file from Cloudinary
            if (avatarPublicId) {
                await cloudinary.uploader.destroy(avatarPublicId);
            }
            return res.status(400).json({ message: "BAD REQUEST : user already exists" });
        }

        // user does not exist, so create one
        //    const newUser = User.create({
        //     username,
        //     displayName,
        //     hashPassword: password ,
        //    })  // User.create creates a user and saves it in one line

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            hashPassword: hashedPassword,
            bio: rawBio,
            displayName,
            avatarUrl: avatarUrl,
            avatarPublicId: avatarPublicId,
        })

        const createdUser = await newUser.save();

        //  Create JWT immediately
        // const accessToken = jwt.sign(
        //     { id: newUser._id, username: newUser.username, email: newUser.email },
        //     process.env.JWT_SECRET,
        //     { expiresIn: "1d" }
        // );

        // const refreshToken = jwt.sign(
        //     { id: newUser._id, username: newUser.username, email: newUser.email },
        //     process.env.JWT_SECRET,
        //     { expiresIn: "7d" }
        // );

        const {accessToken, refreshToken} = generateTokens(createdUser);
      //  console.log(createdUser);

        res.cookie("accessToken", accessToken, {httpOnly : true, secure : process.env.NODE_ENV === 'production', maxAge : 24*60*60*1000});

        res.cookie("refreshToken", refreshToken, {httpOnly : true, secure : process.env.NODE_ENV === 'production',maxAge: 7*24*60*60*1000});

        return res.status(201).json({ message: "User created successfully", user: { id: createdUser._id, username, email, avatarUrl } });

    } catch (err) {
        console.log("Error while registering", err);
        return res.status(500).json({ message: "Error while registering new user : Internal Server Error" });
    }

}


module.exports = register;
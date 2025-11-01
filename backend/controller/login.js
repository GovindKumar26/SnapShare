const User = require("../models/User");
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt');

const generateTokens = (createdUser) => {
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

    return { accessToken, refreshToken };
}

const login = async (req, res) => {
    // Safely read and trim inputs; default to empty string to avoid calling .trim() on undefined
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim();
    const password = req.body.password;

    if ((!username && !email) || !password) {
        return res.status(400).json({ message: "Password or email/username not given for login" });
    }

    const checkUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!checkUser) {
        return res.status(404).json({ message: "User with given username/email does not exist" });
    }

    const passwordValidity = await bcrypt.compare(password, checkUser.hashPassword);

    if (!passwordValidity) {
        return res.status(401).json({ message: "Wrong password" });
    }

    const { accessToken, refreshToken } = generateTokens(checkUser);

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: checkUser._id,
            username: checkUser.username,
            email: checkUser.email,
            avatarUrl: checkUser.avatarUrl
        }
    });

}

module.exports = login;
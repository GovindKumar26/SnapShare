const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next)=>{
    const accessToken = req.cookies?.accessToken;
   // const refreshToken = req.cookies?.refreshToken;

    if(!accessToken) {
        return res.status(401).json({message : "no access token is there"});
    }

    try {
        const decodedPayload = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.user = decodedPayload;
        next();


    } catch (error) {
        return res.status(403).json({message : "token is tampered with or expired"});
    }
}

module.exports = verifyToken; 
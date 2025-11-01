const jwt = require("jsonwebtoken");

const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

module.exports = refreshToken;

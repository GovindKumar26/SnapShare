const logout = (req, res) => {
  // Clear cookies with the same options they were set with
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };
  
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = logout;

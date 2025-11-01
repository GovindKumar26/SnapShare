const express = require("express");
const { followUser, unfollowUser, getFollowers, getFollowing } = require("../controller/followController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/:userId", verifyToken, followUser);
router.delete("/:userId", verifyToken, unfollowUser);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

module.exports = router;

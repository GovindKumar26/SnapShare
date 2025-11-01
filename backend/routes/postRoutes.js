const express = require("express");
const router = express.Router();
const { createPost, getAllPosts, getUserPosts, deletePost } = require("../controller/postController");
const verifyToken = require("../middleware/verifyToken");
const upload = require("../config/multer");

// Protected routes (user must be logged in)
router.post("/", verifyToken, upload.single('image'), createPost);
router.get("/", verifyToken, getAllPosts);
router.get("/user/:id", verifyToken, getUserPosts);
router.delete("/:id", verifyToken, deletePost);

module.exports = router; 
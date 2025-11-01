const express = require("express");
const { addComment, getComments, deleteComment } = require("../controller/commentController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/:postId", verifyToken, addComment);
router.get("/:postId", getComments);
router.delete("/:commentId", verifyToken, deleteComment);

module.exports = router;

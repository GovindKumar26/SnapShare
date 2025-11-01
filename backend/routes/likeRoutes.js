const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { toggleLike } = require('../controller/likeController');

router.post('/toggle', verifyToken, toggleLike);
module.exports = router;
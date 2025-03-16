const express = require("express");
const router = express.Router({mergeParams:true});
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/review.js");

//REVIEWS POST ROUTE
router.post("/" , validateReview ,isLoggedIn, wrapAsync(reviewController.createRoute));

//REVIEWS DELETE ROUTE
router.delete("/:reviewId" ,isLoggedIn,isReviewAuthor, wrapAsync(reviewController.destroyRoute));

module.exports = router;
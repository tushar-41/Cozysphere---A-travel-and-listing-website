const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateListing, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");

const uploads = multer({ storage });

// INDEX ROUTE
router.get("/", wrapAsync(listingController.index));

// NEW ROUTE
router.get("/new", isLoggedIn, listingController.renderNewRoute);

// SHOW ROUTE
router.get("/:id", wrapAsync(listingController.showRoute));

// CREATE ROUTE
router.post("/", isLoggedIn, uploads.single("listing[image]"), validateListing, wrapAsync(listingController.createRoute));

// EDIT ROUTE
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editRoute));

// UPDATE ROUTE
router.put("/:id", isLoggedIn, isOwner,uploads.single("listing[image]"), validateListing, wrapAsync(listingController.updateRoute));

// DESTROY ROUTE
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.destroyRoute));

module.exports = router;

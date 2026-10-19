const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateBooking, canAccessBooking } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// CREATE a booking for a listing
router.post("/listings/:id/bookings", isLoggedIn, validateBooking, wrapAsync(bookingController.create));

// GUEST: my trips
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.myTrips));

// HOST: reservations on my listings (must be before /bookings/:bookingId)
router.get("/bookings/hosting", isLoggedIn, wrapAsync(bookingController.hosting));

// SHOW a booking confirmation
router.get("/bookings/:bookingId", isLoggedIn, wrapAsync(canAccessBooking), wrapAsync(bookingController.show));

// CANCEL a booking (guest or host)
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(canAccessBooking), wrapAsync(bookingController.cancel));

module.exports = router;

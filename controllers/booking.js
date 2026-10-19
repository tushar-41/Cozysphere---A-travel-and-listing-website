const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { parseDay, todayUTC, nightsBetween } = require("../utils/dates.js");

const GST_RATE = 0.18;
const MAX_NIGHTS = 30;

const overlapQuery = (listingId, checkIn, checkOut) => ({
    listing: listingId,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
});

const canCancel = (booking) => booking.status === "confirmed" && booking.checkIn > todayUTC();

module.exports.create = async (req, res) => {
    const { id } = req.params;
    const back = `/listings/${id}`;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing that you requested for does not exists");
        return res.redirect("/listings");
    }
    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot book your own listing");
        return res.redirect(back);
    }

    const checkIn = parseDay(req.body.booking.checkIn);
    const checkOut = parseDay(req.body.booking.checkOut);
    const guests = Number.parseInt(req.body.booking.guests, 10);

    if (!checkIn || !checkOut) {
        req.flash("error", "Please choose valid check-in and check-out dates");
        return res.redirect(back);
    }
    if (checkIn < todayUTC()) {
        req.flash("error", "Check-in cannot be in the past");
        return res.redirect(back);
    }
    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1 || nights > MAX_NIGHTS) {
        req.flash("error", `Stays must be between 1 and ${MAX_NIGHTS} nights`);
        return res.redirect(back);
    }
    if (!(guests >= 1) || guests > listing.maxGuests) {
        req.flash("error", `This place hosts between 1 and ${listing.maxGuests} guests`);
        return res.redirect(back);
    }
    if (await Booking.exists(overlapQuery(listing._id, checkIn, checkOut))) {
        req.flash("error", "Sorry, those dates were just booked. Please pick different dates");
        return res.redirect(back);
    }

    // Price is always computed server-side from the listing, never trusted from the form.
    const subtotal = nights * listing.price;
    const tax = Math.round(subtotal * GST_RATE);
    const booking = await Booking.create({
        listing: listing._id,
        guest: req.user._id,
        checkIn,
        checkOut,
        guests,
        nights,
        pricePerNight: listing.price,
        subtotal,
        tax,
        totalPrice: subtotal + tax,
    });
    req.flash("success", "Booking confirmed! Enjoy your stay");
    res.redirect(`/bookings/${booking._id}`);
};

module.exports.myTrips = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .sort({ checkIn: -1 });
    const today = todayUTC();
    const valid = bookings.filter((b) => b.listing);
    res.render("bookings/trips.ejs", {
        upcoming: valid.filter((b) => b.status === "confirmed" && b.checkOut > today).reverse(),
        past: valid.filter((b) => b.status === "confirmed" && b.checkOut <= today),
        cancelled: valid.filter((b) => b.status === "cancelled"),
    });
};

module.exports.hosting = async (req, res) => {
    const mine = await Listing.find({ owner: req.user._id }).select("_id");
    const bookings = await Booking.find({ listing: { $in: mine.map((l) => l._id) } })
        .populate("listing")
        .populate("guest", "username email")
        .sort({ checkIn: 1 });
    const today = todayUTC();
    const valid = bookings.filter((b) => b.listing);
    const active = valid.filter((b) => b.status === "confirmed" && b.checkOut > today);
    const earnings = valid
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + b.subtotal, 0);
    res.render("bookings/hosting.ejs", {
        active,
        history: valid.filter((b) => !active.includes(b)).reverse(),
        earnings,
    });
};

module.exports.show = async (req, res) => {
    const booking = req.booking;
    await booking.populate("listing");
    await booking.populate("guest", "username email");
    if (!booking.listing) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings");
    }
    res.render("bookings/show.ejs", { booking, canCancel: canCancel(booking) });
};

module.exports.cancel = async (req, res) => {
    const booking = req.booking;
    if (!canCancel(booking)) {
        req.flash("error", "This booking can no longer be cancelled");
        return res.redirect(`/bookings/${booking._id}`);
    }
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();
    req.flash("success", "Booking cancelled");
    res.redirect(req.body.from === "hosting" ? "/bookings/hosting" : "/bookings");
};

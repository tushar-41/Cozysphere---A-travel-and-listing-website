const Listing = require("./models/listing.js");
const ExpressError = require("./utils/expressError.js");
const {listingSchema,reviewSchema,bookingSchema} = require("./schema.js");
const Booking = require("./models/booking.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        // Only GET urls can be revisited after login (a POST redirect would 404).
        if(req.method === "GET") req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in to perform this activity");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async(req,res,next) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing that you requested for does not exists");
        return res.redirect("/listings");
    }
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You dont have permission to do this");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async(req,res,next) => {
    let {id,reviewId} = req.params;
    const review = await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not the auhtor of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

//Server-side validation of Listing
module.exports.validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 ,errMsg);
    }else{
        next();
    }
}

//Server-side validation of reviews
module.exports.validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
}

//Server-side validation of bookings
module.exports.validateBooking = (req,res,next) => {
    let {error} = bookingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
}

//Loads a booking and allows only the guest who made it or the host of the listing
module.exports.canAccessBooking = async(req,res,next) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing","owner");
    if(!booking){
        req.flash("error","Booking not found");
        return res.redirect("/bookings");
    }
    const userId = res.locals.currUser._id;
    const isGuest = booking.guest.equals(userId);
    const isHost = booking.listing && booking.listing.owner && booking.listing.owner.equals(userId);
    if(!isGuest && !isHost){
        req.flash("error","You dont have permission to do this");
        return res.redirect("/bookings");
    }
    // Re-load without the partial populate so controllers can populate what they need.
    req.booking = await Booking.findById(booking._id);
    next();
};

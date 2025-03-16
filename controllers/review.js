const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createRoute = async(req,res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success","New review created");
    res.redirect(`/listings/${listing.id}`);
 }

 module.exports.destroyRoute = async(req,res,next) => {
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id, {$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review deleted");
    res.redirect(`/listings/${id}`);
}
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { CATEGORIES, SLUGS } = require("../utils/categories.js");
const { parseDay, todayUTC } = require("../utils/dates.js");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTS = ["newest", "price_asc", "price_desc", "rating"];

const avgRating = (reviews = []) =>
    reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;

module.exports.index = async(req,res) => {
    const q = (req.query.q || "").toString().trim().slice(0, 80);
    const category = SLUGS.includes(req.query.category) ? req.query.category : "";
    const minPrice = Number.parseFloat(req.query.minPrice);
    const maxPrice = Number.parseFloat(req.query.maxPrice);
    const guests = Number.parseInt(req.query.guests, 10);
    const sort = SORTS.includes(req.query.sort) ? req.query.sort : "newest";
    const checkIn = parseDay(req.query.checkIn);
    const checkOut = parseDay(req.query.checkOut);

    const filter = {};
    if (q) {
        const re = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ title: re }, { location: re }, { country: re }, { description: re }];
    }
    if (category) filter.category = category;
    if (guests > 0) filter.maxGuests = { $gte: guests };
    if (minPrice >= 0 || maxPrice >= 0) {
        filter.price = {};
        if (minPrice >= 0) filter.price.$gte = minPrice;
        if (maxPrice >= 0) filter.price.$lte = maxPrice;
    }

    // Hide listings that already have a confirmed booking overlapping the requested stay.
    if (checkIn && checkOut && checkOut > checkIn) {
        const busy = await Booking.distinct("listing", {
            status: "confirmed",
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn },
        });
        filter._id = { $nin: busy };
    }

    const sortSpec = { price_asc: { price: 1 }, price_desc: { price: -1 } }[sort] || { _id: -1 };
    const found = await Listing.find(filter).sort(sortSpec).populate("reviews", "rating").lean();
    const allListing = found.map((l) => ({
        ...l,
        avgRating: avgRating(l.reviews),
        reviewCount: l.reviews.length,
    }));
    if (sort === "rating") allListing.sort((a, b) => b.avgRating - a.avgRating);

    res.render("index.ejs", {
        allListing,
        categories: CATEGORIES,
        filters: {
            q,
            category,
            minPrice: minPrice >= 0 ? minPrice : "",
            maxPrice: maxPrice >= 0 ? maxPrice : "",
            guests: guests > 0 ? guests : "",
            sort,
            checkIn: checkIn ? req.query.checkIn : "",
            checkOut: checkOut ? req.query.checkOut : "",
        },
        today: todayUTC().toISOString().slice(0, 10),
    });
}

module.exports.renderNewRoute = (req,res) => {
    res.render("new.ejs", { categories: CATEGORIES });
}

module.exports.showRoute = async (req,res) => {
    let {id} = req.params;
    const list = await Listing.findById(id).populate({path: "reviews" , populate: {path:"author"} , }).populate("owner");
    if(!list){
        req.flash("error","Listing that you requested for does not exists");
        return res.redirect("/listings");
    }
    // Upcoming confirmed stays, so the booking widget can block those dates.
    const booked = await Booking.find({
        listing: list._id,
        status: "confirmed",
        checkOut: { $gt: todayUTC() },
    }).select("checkIn checkOut").lean();
    const bookedRanges = booked.map((b) => ({
        from: b.checkIn.toISOString().slice(0, 10),
        to: b.checkOut.toISOString().slice(0, 10),
    }));
    const category = CATEGORIES.find((c) => c.slug === list.category);
    res.render("show.ejs",{
        list,
        bookedRanges,
        category,
        avgRating: avgRating(list.reviews),
        today: todayUTC().toISOString().slice(0, 10),
    });
};

module.exports.createRoute = async(req,res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url,filename};
    await newListing.save();
    req.flash("success","New listing created");
    return res.redirect("/listings");
 }

 module.exports.editRoute = async(req,res) => {
    let {id} = req.params;
    const list = await Listing.findById(id);
    if(!list){
        req.flash("error","Listing that you requested for does not exists");
        return res.redirect("/listings");
    }
    res.render("edit.ejs",{list, categories: CATEGORIES});
}

module.exports.updateRoute = async(req,res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate((id) , {...req.body.listing});

    if(typeof req.file !== "undefined"){
        let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url,filename};
    await listing.save();
    }
    req.flash("success","Listing updated");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyRoute = async(req,res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted");
    res.redirect("/listings");
}

const joi = require("joi");
const { SLUGS } = require("./utils/categories.js");

module.exports.listingSchema = joi.object({
    listing : joi.object({
        title : joi.string().required(),
        description : joi.string().required(),
        location : joi.string().required(),
        country : joi.string().required(),
        price : joi.number().required().min(0),
        category : joi.string().valid(...SLUGS).required(),
        maxGuests : joi.number().integer().min(1).max(20).required(),
        image : joi.string().allow("",null),
    }).required()
});

module.exports.reviewSchema = joi.object({
    review : joi.object({
        rating:joi.number().required().min(1).max(5),
        comment:joi.string().required(),
    }).required()
});
module.exports.bookingSchema = joi.object({
    booking : joi.object({
        checkIn : joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        checkOut : joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        guests : joi.number().integer().min(1).max(20).required(),
    }).required()
});

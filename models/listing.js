const mongoose = require("mongoose");
// const { listingSchema } = require("../schema");
const Schema = mongoose.Schema;
const review = require("./review.js");

const ListingSchema = new Schema({
    title:{
        type:String,
        required:true,   
    },
    description:String,
    image:{
        url: String,
        filename: String,
    },
    price:Number,
    location:String,
    country:String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
});

ListingSchema.post("findOneAndDelete", async(listing) => {
    if(listing){
        await review.deleteMany({_id:{$in:listing.reviews}});
    };
});

const Listing = mongoose.model("Listing",ListingSchema);

module.exports = Listing;
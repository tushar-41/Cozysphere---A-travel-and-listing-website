if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

//review and listing routes
const reviewRouter = require("./routes/review.js");
const listingRouter = require("./routes/listing.js");
const userRouter = require("./routes/user.js");
const Listing = require("./models/listing.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/listing";
const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
};

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs" , ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error", () => {
    console.log("Error in MONGO SESSION STORE",err);
});

//implementing session options
const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

//user login authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flash masseges
app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", async(req,res)=>{
    const allListing = await Listing.find({});
    res.render("index.ejs",{allListing});
})

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.all("*" , (req,res,next) => {
    next(new ExpressError(404,"Page not found!"));
});

app.use((err,req,res,next) => {
    let {statusCode=500 , message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs" , {err});
});

app.listen(8080,() => {
    console.log("server is running on port number 8080");
});





// app.get("/testlisting" , async (req,res) => {
//     let sList = new Listing({
//         title:"My dream place",
//         description:"BY the beach",
//         price:1200,
//         location:"India",
//         country:"india",
//     });

//     await sList.save().then((val) =>{
//         res.send("Listing updated:)");  
//         console.log("sample is saved");
//         console.log(val);
//     });
// });
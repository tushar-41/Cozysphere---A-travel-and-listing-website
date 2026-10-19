// Single source of truth for listing categories (used by model, forms, filters and seed scripts).
const CATEGORIES = [
    { slug: "rooms", label: "Rooms", icon: "fa-solid fa-bed" },
    { slug: "cities", label: "Iconic cities", icon: "fa-solid fa-mountain-city" },
    { slug: "mountains", label: "Mountains", icon: "fa-solid fa-mountain" },
    { slug: "castles", label: "Castles", icon: "fa-brands fa-fort-awesome" },
    { slug: "pools", label: "Amazing pools", icon: "fa-solid fa-person-swimming" },
    { slug: "camping", label: "Camping", icon: "fa-solid fa-campground" },
    { slug: "farms", label: "Farms", icon: "fa-solid fa-cow" },
    { slug: "arctic", label: "Arctic", icon: "fa-regular fa-snowflake" },
    { slug: "beach", label: "Beach", icon: "fa-solid fa-umbrella-beach" },
    { slug: "skiing", label: "Skiing", icon: "fa-solid fa-person-skiing" },
    { slug: "boats", label: "Boats", icon: "fa-solid fa-ship" },
];

const SLUGS = CATEGORIES.map((c) => c.slug);

// Keyword rules, checked in order, used to backfill listings created before categories existed.
const RULES = [
    ["castles", /castle|palace|fort\b/],
    ["skiing", /ski|chalet/],
    ["boats", /boat|yacht|houseboat|canal house/],
    ["arctic", /arctic|igloo|aurora|glacier/],
    ["pools", /pool|infinity|oasis/],
    ["beach", /beach|island|bungalow|coast|ocean|sea\b/],
    ["camping", /camp|tent|treehouse|safari|lodge/],
    ["farms", /farm|ranch|barn|vineyard/],
    ["mountains", /mountain|cabin|retreat|lake|alps|log/],
    ["cities", /loft|penthouse|apartment|downtown|brownstone|city|villa in|tokyo|urban/],
];

function inferCategory(title = "", description = "") {
    const text = `${title} ${description}`.toLowerCase();
    for (const [slug, re] of RULES) {
        if (re.test(text)) return slug;
    }
    return "rooms";
}

module.exports = { CATEGORIES, SLUGS, inferCategory };

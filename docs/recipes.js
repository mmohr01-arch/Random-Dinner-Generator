// Sample recipes – links point to USDA SNAP-Ed recipe card PDFs where available.
// Changes made in the app are in-memory only and reset on page refresh.

let recipes = [
  { id: 1,  recipe_name: "Spaghetti & Meatballs",   cook_time_minutes: 45,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/SpaghettiAndMeatballs.pdf" },
  { id: 2,  recipe_name: "Chicken Stir-Fry",         cook_time_minutes: 25,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/ChickenStirFry.pdf" },
  { id: 3,  recipe_name: "Ground Beef Tacos",        cook_time_minutes: 30,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/GroundBeefTacos.pdf" },
  { id: 4,  recipe_name: "Vegetable Curry",          cook_time_minutes: 35,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/VegetableCurry.pdf" },
  { id: 5,  recipe_name: "Baked Salmon",             cook_time_minutes: 20,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/BakedSalmon.pdf" },
  { id: 6,  recipe_name: "Black Bean Soup",          cook_time_minutes: 40,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/BlackBeanSoup.pdf" },
  { id: 7,  recipe_name: "Beef Stew",                cook_time_minutes: 120, pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/BeefStew.pdf" },
  { id: 8,  recipe_name: "Vegetable Fried Rice",     cook_time_minutes: 25,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/VegetableFriedRice.pdf" },
  { id: 9,  recipe_name: "Chicken Noodle Soup",      cook_time_minutes: 45,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/ChickenNoodleSoup.pdf" },
  { id: 10, recipe_name: "Tuna Pasta Salad",         cook_time_minutes: 20,  pdf_link: "https://snaped.fns.usda.gov/sites/default/files/documents/2018-05/TunaPastaSalad.pdf" },
];

let _nextId = 11;

import {
  UtensilsCrossed, ChefHat, Star, Sparkles, Leaf, Package, Wheat,
} from "lucide-react";

import {
  GiBowlOfRice, GiNoodles, GiChickenLeg, GiFishCooked,
  GiSandwich, GiDonut, GiMilkCarton, GiFruitBowl,
  GiCorn, GiPeanut, GiMeat, GiShrimp, GiPizzaSlice,
  GiTacos, GiHotDog, GiWok, GiCakeSlice, GiChocolateBar,
  GiSodaCan, GiWaterBottle, GiKnifeFork, GiCookingPot,
  GiFire, GiBread, GiCupcake, GiCarrot, GiFriedEggs,
  GiFrenchFries, GiRiceCooker, GiSushis, GiCoffeeCup,
  GiTeapot, GiWineBottle,
} from "react-icons/gi";

import {
  MdOutlineFreeBreakfast, MdOutlineLunchDining,
  MdOutlineDinnerDining, MdOutlineEmojiFoodBeverage,
  MdOutlineSetMeal, MdOutlineBakeryDining, MdIcecream,
} from "react-icons/md";

import { BiDrink } from "react-icons/bi";
import { TbSoup, TbMeat, TbFish, TbSalad, TbBread, TbEgg, TbIceCream, TbGlass } from "react-icons/tb";
import { PiBowlFoodBold, PiCookingPotBold, PiHamburgerBold, PiIceCreamBold } from "react-icons/pi";

const CATEGORY_ICON_MAP = [

  // ══ MEAL TIMING ══
  { keywords: ["breakfast", "morning", "nashta", "naashta", "subah", "nasta", "nasto"], icon: MdOutlineFreeBreakfast },
  { keywords: ["lunch", "dopahar", "afternoon", "midday", "dopaher"], icon: MdOutlineLunchDining },
  { keywords: ["dinner", "raat", "evening", "night", "supper", "raat ka khana"], icon: MdOutlineDinnerDining },
  { keywords: ["brunch"], icon: MdOutlineFreeBreakfast },

  // ══ STARTERS / SNACKS ══
  { keywords: ["starter", "starters", "appetizer", "appetiser", "finger food", "small plate"], icon: GiFire },
  { keywords: ["snack", "snacks", "light bite", "munchies", "chakhna", "timepass"], icon: GiPeanut },
  { keywords: ["chaat", "bhel", "pani puri", "golgappa", "sev puri", "dahi puri", "papdi", "aloo chaat"], icon: GiFire },
  { keywords: ["pakora", "pakoda", "bhajiya", "bhajia", "bonda"], icon: GiFire },
  { keywords: ["samosa", "kachori", "tikki", "aloo tikki"], icon: GiFire },
  { keywords: ["kebab", "seekh", "sheek", "shami", "galouti", "kakori", "boti"], icon: TbMeat },
  { keywords: ["tikka", "malai tikka", "hariyali tikka", "achari tikka"], icon: GiFire },
  { keywords: ["fries", "french fries", "finger chips", "chips"], icon: GiFrenchFries },

  // ══ SOUP ══
  { keywords: ["soup", "shorba", "broth", "rasam", "yakhni", "stew"], icon: TbSoup },

  // ══ SALAD ══
  { keywords: ["salad", "kachumber", "slaw", "raita", "kosambri"], icon: TbSalad },

  // ══ BREADS ══
  { keywords: ["bread", "roti", "naan", "paratha", "chapati", "chapatti", "phulka", "missi roti", "luchi", "kulcha"], icon: TbBread },
  { keywords: ["puri", "poori", "bhatura", "bathura"], icon: GiBread },
  { keywords: ["tandoori roti", "roomali", "roomali roti", "rumaali"], icon: TbBread },
  { keywords: ["bakery", "baked", "bake", "pav", "bun", "toast"], icon: MdOutlineBakeryDining },

  // ══ RICE / BIRYANI ══
  { keywords: ["biryani", "biriyani", "dum biryani", "hyderabadi", "lucknowi biryani", "kolkata biryani"], icon: GiBowlOfRice },
  { keywords: ["rice", "pulao", "pilaf", "fried rice", "khichdi", "khichri", "jeera rice", "saffron rice"], icon: GiBowlOfRice },

  // ══ NOODLES / PASTA ══
  { keywords: ["noodle", "noodles", "chowmein", "chow mein", "hakka", "ramen", "udon", "maggi", "wai wai"], icon: GiNoodles },
  { keywords: ["pasta", "spaghetti", "penne", "macaroni", "lasagna", "fettuccine", "linguine"], icon: GiNoodles },

  // ══ DAL / CURRY / MAIN COURSE ══
  { keywords: ["dal", "daal", "lentil", "chana", "rajma", "chole", "kadhi", "sambhar", "sambar"], icon: PiCookingPotBold },
  { keywords: ["curry", "gravy", "masala", "makhani", "korma", "rogan", "vindaloo", "saag", "palak"], icon: GiCookingPot },
  { keywords: ["main course", "main dish", "entree", "mains", "main"], icon: GiKnifeFork },

  // ══ PANEER / VEG ══
  { keywords: ["paneer", "cottage cheese", "tofu"], icon: Leaf },
  { keywords: ["veg", "vegetarian", "veggie", "sabzi", "sabji", "subzi", "tarkari", "shakahari", "niramish"], icon: Leaf },
  { keywords: ["healthy", "diet", "organic", "low cal", "fitness", "light meal", "weight loss"], icon: Sparkles },
  { keywords: ["green", "garden", "plant based", "plant-based", "vegan"], icon: Leaf },

  // ══ CHICKEN ══
  { keywords: ["chicken", "murgh", "murg", "poultry", "wings", "boneless", "butter chicken", "tandoori chicken", "grilled chicken"], icon: GiChickenLeg },

  // ══ MUTTON / MEAT ══
  { keywords: ["mutton", "lamb", "goat", "gosht", "keema", "kheema", "nihari", "haleem", "paya", "trotters"], icon: TbMeat },
  { keywords: ["beef", "steak", "brisket"], icon: TbMeat },
  { keywords: ["pork", "bacon", "ham", "pulled pork"], icon: TbMeat },
  { keywords: ["non veg", "nonveg", "non-veg", "meat", "maansahari", "mansahari"], icon: GiMeat },

  // ══ SEAFOOD ══
  { keywords: ["fish", "machli", "machhli", "pomfret", "rohu", "catla", "surmai", "rawas", "hilsa", "bangda"], icon: GiFishCooked },
  { keywords: ["seafood", "sea food", "prawn", "jhinga", "shrimp", "crab", "lobster", "tuna", "squid", "mussels"], icon: GiShrimp },

  // ══ EGG ══
  { keywords: ["egg", "anda", "anday", "omelette", "omelet", "boiled egg", "bhurji", "half fry", "fried egg"], icon: GiFriedEggs },

  // ══ TANDOOR ══
  { keywords: ["tandoor", "tandoori", "clay oven", "sigdi", "angeethi"], icon: GiFire },

  // ══ PIZZA ══
  { keywords: ["pizza", "flatbread pizza", "wood fired pizza"], icon: GiPizzaSlice },

  // ══ BURGER / SANDWICH / WRAPS ══
  { keywords: ["burger", "veggie burger", "chicken burger", "aloo burger", "gourmet burger"], icon: PiHamburgerBold },
  { keywords: ["sandwich", "sub", "hoagie", "club sandwich", "grilled sandwich", "toastie"], icon: GiSandwich },
  { keywords: ["wrap", "roll", "frankie", "kathi", "kati", "roti roll", "shawarma", "falafel wrap", "lavash"], icon: GiSandwich },
  { keywords: ["hot dog", "hotdog", "sausage roll"], icon: GiHotDog },
  { keywords: ["taco", "tacos", "nachos", "burrito", "quesadilla", "mexican"], icon: GiTacos },
  { keywords: ["momos", "momo", "dumpling", "dim sum", "wonton", "gyoza", "steamed"], icon: GiWok },

  // ══ THALI / COMBO / MEALS ══
  { keywords: ["thali", "thaali", "plate meal", "full plate", "gujarati thali", "rajasthani thali", "south indian thali", "unlimited thali"], icon: MdOutlineSetMeal },
  { keywords: ["combo", "combination", "set meal", "value meal", "meal deal", "bundled", "saver"], icon: MdOutlineSetMeal },
  { keywords: ["family pack", "family meal", "family combo", "party pack", "bulk order", "catering", "party order"], icon: Package },

  // ══ SOUTH INDIAN ══
  { keywords: ["dosa", "masala dosa", "plain dosa", "rava dosa", "set dosa"], icon: MdOutlineBakeryDining },
  { keywords: ["idli", "idly", "uttapam", "appam", "upma", "pongal", "pesarattu"], icon: PiBowlFoodBold },
  { keywords: ["south indian", "udupi", "kerala", "chettinad", "andhra", "tamil", "kannada"], icon: GiBowlOfRice },

  // ══ NORTH INDIAN ══
  { keywords: ["north indian", "punjabi", "mughlai", "awadhi", "kashmiri", "rajasthani", "lucknowi", "delhi style"], icon: GiCookingPot },

  // ══ CHINESE / INDO-CHINESE ══
  { keywords: ["chinese", "indo chinese", "indo-chinese", "manchurian", "schezwan", "szechuan", "spring roll"], icon: GiWok },

  // ══ JAPANESE ══
  { keywords: ["japanese", "sushi", "sashimi", "teriyaki", "maki"], icon: GiSushis },

  // ══ STREET FOOD ══
  { keywords: ["street food", "street", "roadside", "tapri", "dhaba style", "galli ka khana", "local food"], icon: GiFire },

  // ══ CONTINENTAL / OTHERS ══
  { keywords: ["continental", "western", "italian", "french", "mediterranean"], icon: GiKnifeFork },
  { keywords: ["thai", "vietnamese", "korean", "asian"], icon: GiWok },

  // ══ SWEETS / MITHAI ══
  { keywords: ["mithai", "indian sweet", "gulab jamun", "jalebi", "ladoo", "barfi", "khoya", "peda", "son papdi", "burfi", "halwai"], icon: GiCupcake },
  { keywords: ["halwa", "sheera", "gajar halwa", "moong dal halwa", "suji halwa"], icon: GiCakeSlice },
  { keywords: ["kheer", "payasam", "firni", "phirni", "rabdi", "rabri", "rasmalai", "rasgulla"], icon: GiCakeSlice },
  { keywords: ["sweet", "dessert", "meetha", "mithas", "sweets"], icon: GiCupcake },
  { keywords: ["chocolate", "choco", "truffle", "fudge"], icon: GiChocolateBar },
  { keywords: ["candy", "toffee", "caramel", "butterscotch"], icon: GiChocolateBar },

  // ══ CAKE / BAKERY SWEETS ══
  { keywords: ["cake", "pastry", "brownie", "muffin", "cupcake", "cheesecake", "tart", "eclair", "fondant"], icon: GiCakeSlice },
  { keywords: ["cookie", "biscuit", "wafer", "macaroon", "macaron", "cracker"], icon: GiDonut },
  { keywords: ["donut", "doughnut", "churros"], icon: GiDonut },

  // ══ ICE CREAM / FROZEN ══
  { keywords: ["ice cream", "icecream", "gelato", "kulfi", "sorbet", "frozen dessert", "sundae", "popsicle", "lolly"], icon: PiIceCreamBold },
  { keywords: ["shake", "milkshake", "thick shake", "oreo shake", "mango shake"], icon: TbIceCream },

  // ══ BEVERAGES — HOT ══
  { keywords: ["coffee", "cappuccino", "latte", "espresso", "americano", "mocha", "filter coffee", "cold coffee", "frappe"], icon: GiCoffeeCup },
  { keywords: ["tea", "chai", "masala chai", "green tea", "herbal tea", "kadak chai", "cutting chai", "ginger tea", "tulsi tea"], icon: GiTeapot },
  { keywords: ["hot drink", "hot beverage", "warm drink", "hot chocolate", "cocoa"], icon: MdOutlineEmojiFoodBeverage },

  // ══ BEVERAGES — COLD ══
  { keywords: ["juice", "fresh juice", "fruit juice", "orange juice", "nimbu pani", "lemonade", "sugarcane", "ganne ka ras", "aam panna"], icon: TbGlass },
  { keywords: ["lassi", "chaas", "buttermilk", "mattha", "shrikhand"], icon: GiMilkCarton },
  { keywords: ["smoothie", "health drink", "protein shake", "energy drink", "detox"], icon: TbGlass },
  { keywords: ["mocktail", "virgin", "shirley", "non alcoholic"], icon: BiDrink },
  { keywords: ["cold drink", "soft drink", "soda", "cola", "pepsi", "coke", "sprite", "limca", "thums up", "maaza", "frooti", "fanta"], icon: GiSodaCan },
  { keywords: ["water", "mineral water", "sparkling water", "flavoured water"], icon: GiWaterBottle },
  { keywords: ["milk", "dairy", "doodh", "flavoured milk", "badam milk"], icon: GiMilkCarton },
  { keywords: ["beverage", "beverages", "drink", "drinks", "pey padarth", "peya", "piye"], icon: BiDrink },

  // ══ SPECIAL / CHEF ══
  { keywords: ["chef special", "chef's special", "chef recommendation", "chef pick", "chef choice", "chef"], icon: ChefHat },
  { keywords: ["house special", "house favourite", "house favorite", "signature dish", "signature"], icon: ChefHat },
  { keywords: ["recommended", "must try", "must-try", "bestseller", "best seller", "top pick"], icon: Star },
  { keywords: ["new", "new arrival", "newly added", "fresh addition", "launch", "naya", "new item"], icon: Star },
  { keywords: ["trending", "viral", "hot selling", "in demand", "most ordered"], icon: Star },
  { keywords: ["special", "specials", "today's special", "daily special", "weekend special", "aaj ka special"], icon: Star },
  { keywords: ["seasonal", "festive", "festival", "limited", "eid special", "diwali special", "holi special", "navratri"], icon: Star },
  { keywords: ["popular", "crowd favourite", "crowd favorite", "all time fav"], icon: Star },

  // ══ FRUITS ══
  { keywords: ["fruit", "fruits", "phal", "mango", "aam", "apple", "orange", "mosambi", "watermelon", "papaya", "strawberry"], icon: GiFruitBowl },

  // ══ GRAIN / WHEAT ══
  { keywords: ["whole wheat", "multigrain", "grain", "oat", "oats", "dalia", "porridge", "muesli"], icon: Wheat },

  // ══ CORN / SNACK ══
  { keywords: ["corn", "makai", "popcorn", "bhutta", "sweet corn"], icon: GiCorn },

];

export function getCategoryIcon(categoryName) {
  if (!categoryName) return { Icon: UtensilsCrossed };

  const lower = categoryName.toLowerCase().trim();

  for (const entry of CATEGORY_ICON_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { Icon: entry.icon };
    }
  }

  return { Icon: UtensilsCrossed };
}
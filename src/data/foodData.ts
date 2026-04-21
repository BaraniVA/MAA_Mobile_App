const foodData: Record<string, { image: string, advantages: string[], disadvantages: string[] }> = {
  apple: {
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for heart", "rich in fiber"],
    disadvantages: ["May contain pesticides"]
  },
  banana: {
    image: "https://images.unsplash.com/photo-1571771894821-ad9962117bb1?auto=format&fit=crop&w=800&q=80",
    advantages: ["High potassium", "gives energy", "aids digestion"],
    disadvantages: ["Too many increase blood sugar"]
  },
  mango: {
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich in Vitamin A", "boosts immunity", "good for skin"],
    disadvantages: ["High sugar", "may cause weight gain"]
  },
  orange: {
    image: "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich in Vitamin C"],
    disadvantages: ["Acidic for sensitive stomach"]
  },
  grape: {
    image: "https://images.unsplash.com/photo-1519096845289-95806ee03a1a?auto=format&fit=crop&w=800&q=80",
    advantages: ["Boost immunity"],
    disadvantages: ["High sugar"]
  },
  "black grapes": {
    image: "https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?auto=format&fit=crop&w=800&q=80",
    advantages: ["Boost immunity", "good for skin"],
    disadvantages: ["High sugar"]
  },
  "green grapes": {
    image: "https://images.unsplash.com/photo-1519096845289-95806ee03a1a?auto=format&fit=crop&w=800&q=80",
    advantages: ["Boost immunity", "good for skin"],
    disadvantages: ["High sugar"]
  },
  pineapple: {
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80",
    advantages: ["Anti-inflammatory", "aids digestion"],
    disadvantages: ["Can cause mouth irritation"]
  },
  watermelon: {
    image: "https://images.unsplash.com/photo-1563114773-84221bd62daa?auto=format&fit=crop&w=800&q=80",
    advantages: ["Hydrates body", "low calories"],
    disadvantages: ["Too much may cause bloating"]
  },
  papaya: {
    image: "https://images.unsplash.com/photo-1615486361929-9fdb3f6e4bb3?auto=format&fit=crop&w=800&q=80",
    advantages: ["Improves digestion", "good for skin"],
    disadvantages: ["Excess not safe in pregnancy"]
  },
  guava: {
    image: "https://images.unsplash.com/photo-1621252179027-d445552ad712?auto=format&fit=crop&w=800&q=80",
    advantages: ["Very high Vitamin C", "boosts immunity"],
    disadvantages: ["Seeds may irritate stomach"]
  },
  pomegranate: {
    image: "https://images.unsplash.com/photo-1588910834316-c56020610344?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for blood and heart"],
    disadvantages: ["May interact with medicines"]
  },
  muskmelon: {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Cantaloupe.jpg",
    advantages: ["Cooling effect", "rich in water"],
    disadvantages: ["May upset stomach"]
  },
  "sweet lime": {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Sweet_lime.jpg",
    advantages: ["Vitamin C", "Nausea relief"],
    disadvantages: ["Acidic"]
  },
  mosambi: {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Sweet_lime.jpg",
    advantages: ["Hydrating", "improves immunity"],
    disadvantages: ["Low fiber"]
  },
  sapota: {
    image: "https://images.unsplash.com/photo-1634942704043-34e857e4e1df?auto=format&fit=crop&w=800&q=80",
    advantages: ["Energy booster", "rich fiber"],
    disadvantages: ["High sugar"]
  },
  chikoo: {
    image: "https://images.unsplash.com/photo-1634942704043-34e857e4e1df?auto=format&fit=crop&w=800&q=80",
    advantages: ["Energy booster", "rich in fiber"],
    disadvantages: ["High sugar content"]
  },
  "custard apple": {
    image: "https://images.unsplash.com/photo-1626078299034-3d2c4d2c5c8b?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for brain"],
    disadvantages: ["Seeds are toxic"]
  },
  sitaphal: {
    image: "https://images.unsplash.com/photo-1626078299034-3d2c4d2c5c8b?auto=format&fit=crop&w=800&q=80",
    advantages: ["Energy rich"],
    disadvantages: ["High sugar"]
  },
  jackfruit: {
    image: "https://images.unsplash.com/photo-1604908176997-125f82c8a41b?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich nutrients", "boosts immunity"],
    disadvantages: ["May cause gas"]
  },
  lychee: {
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for skin"],
    disadvantages: ["Excess may lower sugar"]
  },
  "dragon fruit": {
    image: "https://images.unsplash.com/photo-1527324688102-01991c01ee00?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich antioxidants"],
    disadvantages: ["Expensive", "rare allergy"]
  },
  strawberry: {
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for heart"],
    disadvantages: ["May cause allergy"]
  },
  fig: {
    image: "https://images.unsplash.com/photo-1629911721616-0941933ba50c?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for digestion"],
    disadvantages: ["Too many cause diarrhea"]
  },
  anjeer: {
    image: "https://images.unsplash.com/photo-1629911721616-0941933ba50c?auto=format&fit=crop&w=800&q=80",
    advantages: ["Calcium rich", "Fiber"],
    disadvantages: ["Laxative effect"]
  },
  dates: {
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    advantages: ["Energy rich"],
    disadvantages: ["Very high sugar"]
  },
  jamun: {
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da",
    advantages: ["Controls blood sugar"],
    disadvantages: ["May cause constipation"]
  },
  amla: {
    image: "https://images.unsplash.com/photo-1604908177522-4026d3f2f0c0",
    advantages: ["Very high Vitamin C"],
    disadvantages: ["Too sour"]
  },
  bael: {
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Bael_fruit.jpg",
    advantages: ["Good for digestion"],
    disadvantages: ["Hard to digest if unripe"]
  },
  "wood apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Wood_apple.jpg",
    advantages: ["Improves gut health"],
    disadvantages: ["Strong taste"]
  },
  starfruit: {
    image: "https://images.unsplash.com/photo-1596541624647-759082ac2427?auto=format&fit=crop&w=800&q=80",
    advantages: ["Low calorie"],
    disadvantages: ["Harmful in kidney issues"]
  },
  "star fruit": {
    image: "https://images.unsplash.com/photo-1596541624647-759082ac2427?auto=format&fit=crop&w=800&q=80",
    advantages: ["Low calorie"],
    disadvantages: ["Harmful in kidney issues"]
  },
  "passion fruit": {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Passionfruit.jpg",
    advantages: ["Rich fiber"],
    disadvantages: ["Allergy risk"]
  },
  plum: {
    image: "https://images.unsplash.com/photo-1603186741834-367600868472?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good digestion"],
    disadvantages: ["May cause acidity"]
  },
  peach: {
    image: "https://images.unsplash.com/photo-1629911923234-72643a6f1943?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good skin health"],
    disadvantages: ["Allergy possible"]
  },
  pear: {
    image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich fiber"],
    disadvantages: ["Gas if overeaten"]
  },
  cherry: {
    image: "https://images.unsplash.com/photo-1528821128474-27fcafee35a4?auto=format&fit=crop&w=800&q=80",
    advantages: ["Anti-inflammatory"],
    disadvantages: ["Expensive"]
  },
  apricot: {
    image: "https://images.unsplash.com/photo-1566375620955-f28682979624?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for eyes"],
    disadvantages: ["Too many harmful"]
  },
  kiwi: {
    image: "https://images.unsplash.com/photo-1571687949920-59cfc3f6c06d?auto=format&fit=crop&w=800&q=80",
    advantages: ["Boost immunity"],
    disadvantages: ["Allergy possible"]
  },
  blueberry: {
    image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=800&q=80",
    advantages: ["Brain health"],
    disadvantages: ["Costly"]
  },
  raspberry: {
    image: "https://images.unsplash.com/photo-1564344498308-41710972410a?auto=format&fit=crop&w=800&q=80",
    advantages: ["Rich antioxidants"],
    disadvantages: ["Perishable"]
  },
  mulberry: {
    image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80",
    advantages: ["Good for blood"],
    disadvantages: ["Stains easily"]
  },
  coconut: {
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc",
    advantages: ["Healthy fats"],
    disadvantages: ["High calorie"]
  },
  "tender coconut": {
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc",
    advantages: ["Hydration"],
    disadvantages: ["Low protein"]
  },
  "betel nut": {
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Areca_catechu_fruit.jpg",
    advantages: ["Traditional use"],
    disadvantages: ["Not safe for regular eating"]
  },
  "areca nut": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Areca_nut.jpg",
    advantages: ["Traditional use"],
    disadvantages: ["Not safe for regular eating"]
  },
  "betel nut fruit": {
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Areca_catechu_fruit.jpg",
    advantages: ["Traditional use"],
    disadvantages: ["Not recommended in pregnancy"]
  },
  karonda: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Karonda_fruit.jpg",
    advantages: ["Vitamin C"],
    disadvantages: ["Sour taste"]
  },
  phalsa: {
    image: "https://upload.wikimedia.org/wikipedia/commons/0/05/Phalsa_fruit.jpg",
    advantages: ["Cooling fruit"],
    disadvantages: ["Seasonal availability"]
  },
  kokum: {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Kokum_fruit.jpg",
    advantages: ["Good digestion"],
    disadvantages: ["Too sour"]
  },
  ber: {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ziziphus_mauritiana_fruit.jpg",
    advantages: ["Boost immunity"],
    disadvantages: ["May cause cold"]
  },
  ramphal: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/21/Ramphal_fruit.jpg",
    advantages: ["Nutritious"],
    disadvantages: ["Less available"]
  },
  longan: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/36/Longan_fruit.jpg",
    advantages: ["Energy booster"],
    disadvantages: ["High sugar"]
  },
  langsat: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Langsat_fruit.jpg",
    advantages: ["Refreshing"],
    disadvantages: ["Rare"]
  },
  mangosteen: {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Mangosteen_fruit.jpg",
    advantages: ["Rich antioxidants"],
    disadvantages: ["Expensive"]
  },
  avocado: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Avocado.jpg",
    advantages: ["Healthy fats"],
    disadvantages: ["High calorie"]
  },
  breadfruit: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Breadfruit.jpg",
    advantages: ["High carbs"],
    disadvantages: ["Not common"]
  },
  bilimbi: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Bilimbi_fruit.jpg",
    advantages: ["Vitamin C"],
    disadvantages: ["Very sour"]
  },
  soursop: {
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Soursop_fruit.jpg",
    advantages: ["Antioxidants"],
    disadvantages: ["Limited availability"]
  },
  "ice apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Ice_apple.jpg",
    advantages: ["Cooling", "Hydrating"],
    disadvantages: ["None in moderation"]
  },
  nungu: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Ice_apple.jpg",
    advantages: ["Cooling body"],
    disadvantages: ["Seasonal"]
  },
  "palm fruit": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/13/Palm_fruit.jpg",
    advantages: ["Hydrating"],
    disadvantages: ["Sticky texture"]
  },
  "snake fruit": {
    image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Salak_fruit.jpg",
    advantages: ["Rich fiber"],
    disadvantages: ["Hard skin"]
  },
  "rose apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Rose_apple.jpg",
    advantages: ["Low calorie"],
    disadvantages: ["Less sweet"]
  },
  "water apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Water_apple.jpg",
    advantages: ["Hydrating"],
    disadvantages: ["Low nutrition"]
  },
  "hog plum": {
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Hog_plum.jpg",
    advantages: ["Vitamin C"],
    disadvantages: ["Sour"]
  },
  "cluster fig": {
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Cluster_fig.jpg",
    advantages: ["Digestive health"],
    disadvantages: ["Sticky latex"]
  },
  "elephant apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Elephant_apple.jpg",
    advantages: ["Medicinal uses"],
    disadvantages: ["Hard texture"]
  },
  "governor's plum": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/12/Carissa_carandas.jpg",
    advantages: ["Vitamin rich"],
    disadvantages: ["Thorny plant"]
  },
  "indian almond": {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Terminalia_catappa_fruit.jpg",
    advantages: ["Nutritious"],
    disadvantages: ["Hard shell"]
  },
  "malay apple": {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Malay_apple.jpg",
    advantages: ["Hydrating"],
    disadvantages: ["Watery taste"]
  },
  "java plum": {
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da",
    advantages: ["Controls sugar"],
    disadvantages: ["Stains mouth"]
  },
  "indian fig": {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Figs_on_tree.jpg",
    advantages: ["Fiber", "Calcium"],
    disadvantages: ["Laxative"]
  },
  "indian gooseberry": {
    image: "https://images.unsplash.com/photo-1604908177522-4026d3f2f0c0",
    advantages: ["Very high Vitamin C", "boosts immunity"],
    disadvantages: ["Too sour", "may irritate stomach"]
  },
  "indian blackberry": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/36/Syzygium_cumini_fruits.jpg",
    advantages: ["Iron", "Antioxidants"],
    disadvantages: ["None in moderation"]
  },
  persimmon: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Persimmon.jpg",
    advantages: ["Rich fiber"],
    disadvantages: ["Too sweet"]
  },
  "indian persimmon": {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Persimmon.jpg",
    advantages: ["Rich fiber"],
    disadvantages: ["Too sweet"]
  },
  "indian mulberry": {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Noni_fruit.jpg",
    advantages: ["Medicinal"],
    disadvantages: ["Strong smell"]
  },
  carrot: {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Carrot.jpg",
    advantages: ["Good for eyes"],
    disadvantages: ["Too much may affect skin color"]
  },
  potato: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Patates.jpg",
    advantages: ["Energy source"],
    disadvantages: ["High glycemic index"]
  },
  tomato: {
    image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg",
    advantages: ["Rich in lycopene"],
    disadvantages: ["Acidic"]
  },
  onion: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Onion_on_White.JPG",
    advantages: ["Boosts immunity"],
    disadvantages: ["Bad breath"]
  },
  spinach: {
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Spinach_leaves.jpg",
    advantages: ["Iron rich"],
    disadvantages: ["Oxalates"]
  },
  cabbage: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Cabbage.jpg",
    advantages: ["Low calorie"],
    disadvantages: ["Gas"]
  },
  cauliflower: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Cauliflower.JPG",
    advantages: ["High fiber"],
    disadvantages: ["Bloating"]
  },
  broccoli: {
    image: "https://upload.wikimedia.org/wikipedia/commons/0/03/Broccoli_and_cross_section_edit.jpg",
    advantages: ["Cancer-fighting"],
    disadvantages: ["Gas"]
  },
  cucumber: {
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Cucumber.jpg",
    advantages: ["Hydrating"],
    disadvantages: ["Bloating"]
  },
  brinjal: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/15/Eggplant.jpg",
    advantages: ["Low calorie"],
    disadvantages: ["Allergies"]
  },
  beetroot: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beetroot_jm26647.jpg",
    advantages: ["Improves blood flow"],
    disadvantages: ["Red urine"]
  },
  radish: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Radish.jpg",
    advantages: ["Good digestion"],
    disadvantages: ["Strong smell"]
  },
  pumpkin: {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Pumpkin.jpg",
    advantages: ["Vitamin A rich"],
    disadvantages: ["Overeating issues"]
  },
  bittergourd: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Bitter_gourd.jpg",
    advantages: ["Good for diabetes"],
    disadvantages: ["Very bitter"]
  },
  ladyfinger: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Okra.jpg",
    advantages: ["Good digestion"],
    disadvantages: ["Slimy"]
  },
  peas: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Peas_in_pods.jpg",
    advantages: ["Protein rich"],
    disadvantages: ["Gas"]
  },
  corn: {
    image: "https://upload.wikimedia.org/wikipedia/commons/0/09/Maize.jpg",
    advantages: ["Energy rich"],
    disadvantages: ["High carbs"]
  },
  mushroom: {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/74/Mushroom.jpg",
    advantages: ["Low calorie"],
    disadvantages: ["Some toxic types"]
  },
  garlic: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Garlic.jpg",
    advantages: ["Boost immunity"],
    disadvantages: ["Strong smell"]
  },
  ginger: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Ginger.jpg",
    advantages: ["Aids digestion"],
    disadvantages: ["Heartburn"]
  },
  blackberry: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/26/Blackberries.jpg",
    advantages: ["Vitamin K", "Fiber"],
    disadvantages: ["Seeds may be annoying"]
  },
  almond: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Almonds_on_white_background.jpg",
    advantages: ["Protein", "Healthy fats", "Vitamin E"],
    disadvantages: ["High calorie"]
  },
  walnut: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Walnut_Kernels.jpg",
    advantages: ["Omega-3", "Brain health"],
    disadvantages: ["Can go rancid"]
  },
  cashew: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Cashew_Nut.jpg",
    advantages: ["Magnesium", "Iron"],
    disadvantages: ["High fat"]
  },
  pistachio: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Pistachio_nuts_in_shell.jpg",
    advantages: ["Antioxidants", "Eye health"],
    disadvantages: ["Often salted"]
  },
  peanut: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/30/Peanuts_in_shell.jpg",
    advantages: ["Protein", "Folate"],
    disadvantages: ["Common allergen"]
  },
  chia: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Chia_seeds_salvia_hispanica.jpg",
    advantages: ["Omega-3", "Fiber"],
    disadvantages: ["Absorbs lot of water"]
  },
  flaxseed: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Flax_seeds.jpg",
    advantages: ["Omega-3", "Lignans"],
    disadvantages: ["Must be ground to digest"]
  },
  sunflower: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Sunflower_seeds.jpg",
    advantages: ["Vitamin E", "Selenium"],
    disadvantages: ["High calorie"]
  },
  "pumpkin seed": {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Pumpkin_seeds.jpg",
    advantages: ["Zinc", "Magnesium"],
    disadvantages: ["High calorie"]
  },
  sesame: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Sesame_seeds.jpg",
    advantages: ["Calcium", "Iron"],
    disadvantages: ["High calorie"]
  },
  asparagus: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Asparagus-Bundle.jpg",
    advantages: ["Folate", "Vitamin K"],
    disadvantages: ["Makes urine smell"]
  },
  artichoke: {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Artichoke_cross_section.jpg",
    advantages: ["Fiber", "Liver health"],
    disadvantages: ["Hard to prepare"]
  },
  celery: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Celery_cross_section.jpg",
    advantages: ["Hydrating", "Low calorie"],
    disadvantages: ["Low nutrient density"]
  },
  leek: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Leek.jpg",
    advantages: ["Vitamin K", "Manganese"],
    disadvantages: ["Can be sandy/dirty"]
  },
  kale: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/27/Kale_Leaves.jpg",
    advantages: ["Vitamin A, C, K", "Calcium"],
    disadvantages: ["Can be tough to chew"]
  },
  chard: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Swiss_Chard.jpg",
    advantages: ["Magnesium", "Vitamin K"],
    disadvantages: ["High in oxalates"]
  },
  "sweet potato": {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/af/Sweet_potato.jpg",
    advantages: ["Vitamin A", "Fiber"],
    disadvantages: ["High glycemic index"]
  },
  yam: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Yam_tuber.jpg",
    advantages: ["Energy", "Potassium"],
    disadvantages: ["Must be cooked"]
  },
  zucchini: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Zucchini.jpg",
    advantages: ["Low calorie", "Vitamin C"],
    disadvantages: ["High water content"]
  },
  "bell pepper": {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Bell_Peppers.jpg",
    advantages: ["Vitamin C", "Antioxidants"],
    disadvantages: ["May cause gas"]
  },
  eggplant: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/15/Eggplant.jpg",
    advantages: ["Fiber", "Antioxidants"],
    disadvantages: ["Can be bitter"]
  },
  "green beans": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Green_beans.jpg",
    advantages: ["Vitamin C", "Fiber"],
    disadvantages: ["May cause gas"]
  },
  "brussels sprouts": {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/60/Brussels_sprouts_on_stalk.jpg",
    advantages: ["Vitamin K", "Fiber"],
    disadvantages: ["Strong smell", "Gas"]
  },
  turnip: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Turnip_2.jpg",
    advantages: ["Vitamin C", "Fiber"],
    disadvantages: ["Bitter if large"]
  },
  parsnip: {
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Parsnip.jpg",
    advantages: ["Fiber", "Potassium"],
    disadvantages: ["High sugar for a veg"]
  },
  fennel: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Fennel_bulb.jpg",
    advantages: ["Aids digestion", "Vitamin C"],
    disadvantages: ["Strong anise flavor"]
  },
  kohlrabi: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Kohlrabi.jpg",
    advantages: ["Vitamin C", "Fiber"],
    disadvantages: ["Tough skin"]
  },
  "bok choy": {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/40/Bok_choy.jpg",
    advantages: ["Calcium", "Vitamin A"],
    disadvantages: ["Goitrogens if raw"]
  },
  arugula: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Arugula_leaves.jpg",
    advantages: ["Calcium", "Folate"],
    disadvantages: ["Peppery/bitter"]
  },
  watercress: {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/12/Watercress.jpg",
    advantages: ["Vitamin K", "Antioxidants"],
    disadvantages: ["Must be washed well"]
  },
  seaweed: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Dried_seaweed.jpg",
    advantages: ["Iodine", "Minerals"],
    disadvantages: ["High sodium"]
  },
  lentils: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Red_Lentils_in_a_Bowl.jpg",
    advantages: ["Protein", "Iron", "Folate"],
    disadvantages: ["Gas"]
  },
  chickpeas: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/30/Chickpeas_in_a_bowl.jpg",
    advantages: ["Protein", "Fiber"],
    disadvantages: ["Gas"]
  },
  quinoa: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Quinoa_seeds.jpg",
    advantages: ["Complete protein", "Fiber"],
    disadvantages: ["Saponins (must rinse)"]
  },
  oats: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/30/Oatmeal.jpg",
    advantages: ["Fiber", "Heart health"],
    disadvantages: ["High carb"]
  },
  lemon: {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lemon.jpg",
    advantages: ["Vitamin C", "Nausea relief"],
    disadvantages: ["Acidic for teeth"]
  },
  lime: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/df/Lime-Whole-Split.jpg",
    advantages: ["Vitamin C", "Flavor enhancer"],
    disadvantages: ["Acidic"]
  },
  grapefruit: {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Grapefruit.jpg",
    advantages: ["Weight management", "Vitamin C"],
    disadvantages: ["Interacts with many medications"]
  },
  cranberry: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Cranberries_2005.jpg",
    advantages: ["Prevents UTIs", "Antioxidants"],
    disadvantages: ["Very tart, often sweetened"]
  },
  durian: {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Durian.jpg",
    advantages: ["Nutrient dense", "Energy"],
    disadvantages: ["Strong smell", "High calorie"]
  },
  rambutan: {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Rambutan_fruit.jpg",
    advantages: ["Vitamin C", "Iron"],
    disadvantages: ["High sugar"]
  },
  hazelnut: {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Hazelnuts.jpg",
    advantages: ["Vitamin E", "Healthy fats"],
    disadvantages: ["High calorie"]
  },
  pecan: {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Pecans_in_shell.jpg",
    advantages: ["Antioxidants", "Zinc"],
    disadvantages: ["High calorie"]
  },
  "brazil nut": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Brazil_nuts.jpg",
    advantages: ["Selenium", "Healthy fats"],
    disadvantages: ["Limit to 1-2 a day (selenium toxicity)"]
  },
  macadamia: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Macadamia_nuts.jpg",
    advantages: ["Healthy fats", "Manganese"],
    disadvantages: ["Very high calorie"]
  },
  "pine nut": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Pine_nuts.jpg",
    advantages: ["Vitamin K", "Magnesium"],
    disadvantages: ["Expensive"]
  },
  poppy: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Poppy_seeds.jpg",
    advantages: ["Fiber", "Calcium"],
    disadvantages: ["May interfere with drug tests"]
  },
  hemp: {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Hemp_seeds.jpg",
    advantages: ["Complete protein", "Omega-3"],
    disadvantages: ["Expensive"]
  },
  "broccoli rabe": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Broccoli_rabe.jpg",
    advantages: ["Vitamin A, C, K", "Iron"],
    disadvantages: ["Bitter taste"]
  },
  rutabaga: {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Rutabaga.jpg",
    advantages: ["Vitamin C", "Potassium"],
    disadvantages: ["High carb"]
  },
  salsify: {
    image: "https://upload.wikimedia.org/wikipedia/commons/2/23/Salsify.jpg",
    advantages: ["Fiber", "Iron"],
    disadvantages: ["Hard to find"]
  },
  "burdock root": {
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Burdock_root.jpg",
    advantages: ["Antioxidants", "Blood purifier"],
    disadvantages: ["May lower blood sugar"]
  },
  "lotus root": {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Lotus_root.jpg",
    advantages: ["Vitamin C", "Fiber"],
    disadvantages: ["Must be cooked"]
  }
};

export default foodData;

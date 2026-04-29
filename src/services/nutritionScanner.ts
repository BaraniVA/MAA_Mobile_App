export type NutritionSafety = "safe" | "limit" | "avoid";

export type NutritionScanResult = {
  matchedFood: string;
  safety: NutritionSafety;
  guidance: string[];
  reason: string;
};

const barcodeToFood: Record<string, string> = {
  "8901030868899": "milk",
  "8901491101771": "banana chips",
  "8901063162360": "dark chocolate",
  "8901030838328": "orange juice",
  "8901491101511": "instant noodles",
};

const avoidKeywords = ["alcohol", "wine", "beer", "raw fish", "sushi", "high mercury fish", "unpasteurized"]; 
const limitKeywords = ["coffee", "caffeine", "tea", "dark chocolate", "soda", "instant noodles", "processed"]; 

const safeFoods = [
  "apple",
  "banana",
  "orange",
  "milk",
  "yogurt",
  "egg",
  "oats",
  "spinach",
  "avocado",
  "dal",
  "rice",
  "chapati",
  "paneer",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

export function lookupFoodFromBarcode(barcode: string): string | null {
  return barcodeToFood[barcode] ?? null;
}

export function classifyFoodForPregnancy(input: string): NutritionScanResult {
  const normalized = normalize(input);

  if (!normalized) {
    return {
      matchedFood: "Unknown item",
      safety: "limit",
      reason: "No food name was provided.",
      guidance: [
        "Enter a clear food name to improve guidance.",
        "Prefer cooked, fresh, and low-processed options.",
      ],
    };
  }

  const avoidHit = avoidKeywords.find((keyword) => normalized.includes(keyword));
  if (avoidHit) {
    return {
      matchedFood: input,
      safety: "avoid",
      reason: `Detected high-risk keyword: ${avoidHit}.`,
      guidance: [
        "Avoid this item during pregnancy unless cleared by your clinician.",
        "Choose pasteurized and fully cooked alternatives.",
        "If already consumed and symptoms appear, contact emergency care.",
      ],
    };
  }

  const limitHit = limitKeywords.find((keyword) => normalized.includes(keyword));
  if (limitHit) {
    return {
      matchedFood: input,
      safety: "limit",
      reason: `Detected moderation keyword: ${limitHit}.`,
      guidance: [
        "Use this item in small portions.",
        "Pair with hydration and nutrient-dense foods.",
        "Track tolerance and avoid frequent daily intake.",
      ],
    };
  }

  const safeHit = safeFoods.find((food) => normalized.includes(food));
  if (safeHit) {
    return {
      matchedFood: input,
      safety: "safe",
      reason: `Common pregnancy-friendly food detected: ${safeHit}.`,
      guidance: [
        "Safe in normal portions with proper hygiene.",
        "Prefer fresh and well-washed or properly cooked preparation.",
        "Maintain variety across meals for balanced nutrition.",
      ],
    };
  }

  return {
    matchedFood: input,
    safety: "limit",
    reason: "Item not in local high-confidence list.",
    guidance: [
      "Start with a small portion and monitor symptoms.",
      "Avoid raw or unpasteurized versions.",
      "Ask your clinician for personal dietary restrictions.",
    ],
  };
}

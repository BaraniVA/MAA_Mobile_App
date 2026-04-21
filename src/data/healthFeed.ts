export type HealthFeedItem = {
  slug: string;
  tag: "ARTICLE" | "VIDEO" | "TIP";
  section: string;
  stage: string;
  title: string;
  subtitle: string;
  image: string;
  body: string[];
  bulletPoints: string[];
};

export const healthFeedItems: HealthFeedItem[] = [
  {
    slug: "nutrition-guide-trimester-2",
    tag: "ARTICLE",
    section: "NUTRITION",
    stage: "TRIMESTER 2",
    title: "Nutrition Guide for Trimester 2",
    subtitle: "Essential vitamins and minerals you need during your second trimester.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80",
    body: [
      "Your baby is growing rapidly in trimester 2, so food quality matters more than just calories.",
      "Aim for balanced meals with protein, iron, calcium, and healthy fats to support both growth and maternal energy.",
    ],
    bulletPoints: [
      "Add an iron source daily: lentils, spinach, eggs, or fortified grains.",
      "Pair iron foods with vitamin C sources to improve absorption.",
      "Include calcium-rich options like milk, yogurt, or paneer.",
      "Stay hydrated throughout the day to reduce fatigue and headaches.",
    ],
  },
  {
    slug: "gentle-prenatal-yoga",
    tag: "VIDEO",
    section: "EXERCISE",
    stage: "ALL STAGES",
    title: "Gentle Prenatal Yoga",
    subtitle: "15-minute routine to help with back pain and flexibility.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80",
    body: [
      "Gentle prenatal movement can reduce stiffness and improve sleep quality.",
      "Keep all stretches comfortable and avoid any pose that causes pain, dizziness, or breathlessness.",
    ],
    bulletPoints: [
      "Start with deep breathing for 2 minutes.",
      "Use cat-cow and seated side stretches to release lower back tension.",
      "Finish with supported rest on your left side.",
      "Stop and consult your doctor if you feel contractions or discomfort.",
    ],
  },
  {
    slug: "managing-pregnancy-anxiety",
    tag: "ARTICLE",
    section: "MENTAL HEALTH",
    stage: "ALL STAGES",
    title: "Managing Pregnancy Anxiety",
    subtitle: "Tips for staying calm and mindful during your journey.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
    body: [
      "Pregnancy anxiety is common and manageable with small daily routines.",
      "The goal is not to remove every worry, but to build calm habits that help your nervous system settle.",
    ],
    bulletPoints: [
      "Try a 4-6 breathing cycle for five minutes.",
      "Limit doom-scrolling and set one check-in time for medical information.",
      "Talk with your support person about specific fears.",
      "Reach out to a professional if worry affects sleep or appetite consistently.",
    ],
  },
  {
    slug: "hospital-bag-checklist",
    tag: "TIP",
    section: "PREPARATION",
    stage: "TRIMESTER 3",
    title: "Hospital Bag Checklist",
    subtitle: "Everything you need to pack for your big day.",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80",
    body: [
      "Packing early lowers stress and helps you feel prepared as your due date approaches.",
      "Keep your bag visible so it is easy to grab whenever labor starts.",
    ],
    bulletPoints: [
      "ID, insurance records, and maternity documents.",
      "Comfortable clothes, nursing-friendly tops, and slippers.",
      "Phone charger, toiletries, and snacks.",
      "Baby outfit, swaddle cloth, and diapers for discharge.",
    ],
  },
  {
    slug: "postpartum-recovery-tips",
    tag: "ARTICLE",
    section: "POSTPARTUM",
    stage: "ALL STAGES",
    title: "Postpartum Recovery Tips",
    subtitle: "What to expect in the first few weeks after delivery.",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
    body: [
      "Recovery is gradual and different for every mother.",
      "Rest, hydration, and support are key foundations in the first weeks.",
    ],
    bulletPoints: [
      "Prioritize sleep whenever your baby sleeps.",
      "Keep meals simple and nutrient dense.",
      "Watch for warning signs like fever, severe pain, or heavy bleeding.",
      "Ask for help without waiting until you are exhausted.",
    ],
  },
  {
    slug: "iron-rich-foods-pregnancy",
    tag: "TIP",
    section: "NUTRITION",
    stage: "ALL STAGES",
    title: "Iron-Rich Foods for Pregnancy",
    subtitle: "Boost your energy levels with these iron-packed snacks.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    body: [
      "Iron needs increase during pregnancy, and low iron can cause fatigue and dizziness.",
      "Small daily choices can improve your iron intake significantly.",
    ],
    bulletPoints: [
      "Try roasted chickpeas, dates, and pumpkin seeds as snacks.",
      "Use spinach and lentils in soups and curries.",
      "Pair iron foods with citrus fruits for better absorption.",
      "Discuss supplements with your doctor if blood levels are low.",
    ],
  },
];

export function getHealthFeedItemBySlug(slug: string) {
  return healthFeedItems.find((item) => item.slug === slug) ?? null;
}

export type SymptomCategory = {
  id: string;
  label: string;
  symptoms: string[];
};

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: "head",
    label: "Head & Neurological",
    symptoms: [
      "Headache",
      "Dizziness",
      "Migraine",
      "Blurred vision",
      "Confusion",
      "Fainting",
      "Neck stiffness",
    ],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    symptoms: [
      "Cough",
      "Sore throat",
      "Shortness of breath",
      "Wheezing",
      "Runny nose",
      "Chest congestion",
      "Loss of smell",
    ],
  },
  {
    id: "digestive",
    label: "Digestive",
    symptoms: [
      "Stomach pain",
      "Nausea",
      "Vomiting",
      "Loose stools",
      "Constipation",
      "Bloating",
      "Loss of appetite",
    ],
  },
  {
    id: "cardio",
    label: "Cardiovascular",
    symptoms: [
      "Chest discomfort",
      "Palpitations",
      "Swelling in legs",
      "Cold sweats",
      "Pain spreading to arm or jaw",
    ],
  },
  {
    id: "musculo",
    label: "Musculoskeletal",
    symptoms: ["Back pain", "Joint pain", "Muscle ache", "Stiffness", "Swollen joint", "Weakness"],
  },
  {
    id: "skin",
    label: "Skin",
    symptoms: ["Rash", "Itching", "Hives", "Dry skin", "Skin discoloration", "Slow healing wound"],
  },
  {
    id: "general",
    label: "General",
    symptoms: ["Fever", "Fatigue", "Chills", "Night sweats", "Weight change", "Poor sleep"],
  },
  {
    id: "other",
    label: "Other",
    symptoms: [
      "Anxiety",
      "Low mood",
      "Frequent urination",
      "Burning urination",
      "Eye redness",
      "Ear pain",
    ],
  },
];

export const ALL_SYMPTOMS = SYMPTOM_CATEGORIES.flatMap((c) => c.symptoms).sort();

export const DEMO_SCENARIOS = [
  {
    id: "flu",
    title: "Fever, headache and fatigue",
    description: "A common short-term illness pattern.",
    text: "I have had a fever and a headache for two days and I feel very tired.",
    symptoms: ["Fever", "Headache", "Fatigue"],
  },
  {
    id: "cold",
    title: "Cough, sore throat, mild fever",
    description: "Upper respiratory symptoms.",
    text: "I have a cough and a sore throat with a mild fever since yesterday.",
    symptoms: ["Cough", "Sore throat", "Fever"],
  },
  {
    id: "stomach",
    title: "Stomach pain, nausea, loose stools",
    description: "Digestive discomfort.",
    text: "I have stomach pain with nausea and loose stools since this morning.",
    symptoms: ["Stomach pain", "Nausea", "Loose stools"],
  },
  {
    id: "urgent",
    title: "Chest discomfort and shortness of breath",
    description: "Demonstrates the urgent-attention workflow.",
    text: "I have chest discomfort and shortness of breath that started an hour ago.",
    symptoms: ["Chest discomfort", "Shortness of breath"],
  },
];

export const CHAT_SUGGESTIONS = [
  "I have a headache and fever.",
  "What could cause stomach pain?",
  "When should I see a doctor?",
  "What are common signs of dehydration?",
  "How can I improve my sleep?",
  "What does high blood pressure mean?",
];

export const QUICK_ACTIONS = [
  { label: "Explain Simply", prompt: "Please explain that again in very simple language." },
  { label: "Give More Details", prompt: "Give me more detail about that." },
  { label: "What Should I Do Next?", prompt: "What should I do next?" },
  { label: "Warning Signs", prompt: "What warning signs should I watch out for?" },
  { label: "Ask Follow-Up", prompt: "What follow-up questions should I be thinking about?" },
];

export type EducationTopic = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  overview: string;
  symptoms: string[];
  riskFactors: string[];
  prevention: string[];
  seekHelp: string[];
  faqs: { q: string; a: string }[];
};

export const EDUCATION_CATEGORIES = [
  "Common Conditions",
  "Nutrition",
  "Sleep",
  "Fitness",
  "Mental Wellness",
  "Preventive Health",
  "First Aid",
  "Healthy Lifestyle",
  "Women's Health",
  "Men's Health",
];

export const EDUCATION_TOPICS: EducationTopic[] = [
  {
    slug: "common-cold-and-flu",
    title: "Common Cold & Seasonal Flu",
    category: "Common Conditions",
    summary: "How to tell them apart and care for yourself at home.",
    overview:
      "Colds and influenza are viral infections of the respiratory tract. Colds usually build up gradually and stay mild, while flu often arrives suddenly with fever and body aches. Most people recover with rest and fluids.",
    symptoms: [
      "Runny or blocked nose",
      "Sore throat",
      "Cough",
      "Fever and chills (more common with flu)",
      "Body aches and tiredness",
    ],
    riskFactors: [
      "Close contact with people who are unwell",
      "Very young or older age",
      "Weakened immune system",
      "Long-term lung conditions",
    ],
    prevention: [
      "Wash hands regularly",
      "Cover coughs and sneezes",
      "Stay home when unwell",
      "Consider seasonal vaccination as advised by a professional",
    ],
    seekHelp: [
      "Difficulty breathing or chest pain",
      "Fever that lasts more than a few days",
      "Symptoms that worsen after starting to improve",
      "Dehydration or confusion",
    ],
    faqs: [
      {
        q: "How long do symptoms usually last?",
        a: "Cold symptoms often ease within 7-10 days; flu can take a bit longer. Persistent or worsening symptoms deserve a professional review.",
      },
      {
        q: "Do I need antibiotics?",
        a: "Antibiotics do not work against viruses. Only a licensed clinician can decide whether any medicine is appropriate for you.",
      },
    ],
  },
  {
    slug: "balanced-nutrition",
    title: "Building a Balanced Plate",
    category: "Nutrition",
    summary: "Simple, sustainable ways to structure daily meals.",
    overview:
      "A balanced plate generally combines vegetables and fruit, whole grains, a protein source and healthy fats. Consistency matters more than perfection, and individual needs vary with age, activity and medical conditions.",
    symptoms: [
      "Frequent energy dips",
      "Feeling hungry soon after eating",
      "Difficulty concentrating",
    ],
    riskFactors: [
      "Highly processed diet",
      "Skipping meals regularly",
      "Very low fibre intake",
      "Excess added sugar",
    ],
    prevention: [
      "Fill half the plate with vegetables and fruit",
      "Choose whole grains over refined grains",
      "Include a protein source at each meal",
      "Stay hydrated through the day",
    ],
    seekHelp: [
      "Unintentional weight loss or gain",
      "Ongoing digestive discomfort",
      "Nutrition planning with a medical condition such as diabetes",
    ],
    faqs: [
      {
        q: "Do I need supplements?",
        a: "Most nutrients are best obtained from food. Supplements should be discussed with a qualified healthcare professional.",
      },
    ],
  },
  {
    slug: "better-sleep",
    title: "Sleep Quality Essentials",
    category: "Sleep",
    summary: "Habits that support restorative sleep.",
    overview:
      "Most adults function best with roughly 7-9 hours of sleep. Regular timing, light exposure during the day and a calm wind-down routine tend to help sleep quality more than any single trick.",
    symptoms: [
      "Trouble falling asleep",
      "Waking frequently at night",
      "Daytime sleepiness",
      "Irritability or low focus",
    ],
    riskFactors: [
      "Irregular sleep schedule",
      "Late caffeine or heavy meals",
      "Screen use right before bed",
      "High stress levels",
    ],
    prevention: [
      "Keep consistent sleep and wake times",
      "Reduce bright screens an hour before bed",
      "Keep the bedroom cool, dark and quiet",
      "Get natural daylight in the morning",
    ],
    seekHelp: [
      "Loud snoring with pauses in breathing",
      "Persistent insomnia over several weeks",
      "Falling asleep unintentionally during the day",
    ],
    faqs: [
      {
        q: "Are naps bad?",
        a: "Short early-afternoon naps suit many people. Long or late naps can make night-time sleep harder.",
      },
    ],
  },
  {
    slug: "everyday-fitness",
    title: "Movement for Everyday Health",
    category: "Fitness",
    summary: "How much activity is generally recommended, and how to start.",
    overview:
      "General guidance for adults is around 150 minutes of moderate activity per week plus muscle-strengthening on two days. Starting small and building gradually is usually safer and more sustainable.",
    symptoms: ["Low stamina", "Stiffness", "Low energy levels"],
    riskFactors: ["Long sedentary periods", "Sudden intense training", "Poor warm-up habits"],
    prevention: [
      "Break up long sitting periods",
      "Increase intensity gradually",
      "Warm up and cool down",
      "Mix cardio, strength and flexibility work",
    ],
    seekHelp: [
      "Chest discomfort during activity",
      "Unusual breathlessness",
      "Joint pain that persists after rest",
    ],
    faqs: [
      {
        q: "I have a medical condition. Can I exercise?",
        a: "Often yes, but the right plan depends on your situation. Check with a licensed clinician before starting.",
      },
    ],
  },
  {
    slug: "mental-wellness",
    title: "Everyday Mental Wellness",
    category: "Mental Wellness",
    summary: "Supporting emotional health and knowing when to reach out.",
    overview:
      "Mental wellness is shaped by sleep, connection, movement, meaning and stress load. Low mood or anxiety at times is common; persistent or worsening difficulty deserves professional support.",
    symptoms: [
      "Persistent low mood",
      "Loss of interest in usual activities",
      "Ongoing worry or restlessness",
      "Changes in sleep or appetite",
    ],
    riskFactors: ["Chronic stress", "Isolation", "Major life changes", "Poor sleep"],
    prevention: [
      "Maintain social connection",
      "Keep regular routines",
      "Move your body daily",
      "Practise brief relaxation or breathing exercises",
    ],
    seekHelp: [
      "Symptoms lasting more than two weeks",
      "Difficulty functioning at work, study or home",
      "Any thoughts of harming yourself — contact local emergency services or a crisis service immediately",
    ],
    faqs: [
      {
        q: "Is it normal to feel anxious sometimes?",
        a: "Occasional anxiety is a normal human response. It is worth professional attention when it is persistent or interferes with daily life.",
      },
    ],
  },
  {
    slug: "preventive-checkups",
    title: "Preventive Health Checks",
    category: "Preventive Health",
    summary: "Why routine checks matter and what they often include.",
    overview:
      "Preventive care aims to detect issues early. Which checks apply depends on age, sex, family history and existing conditions, so a clinician should personalise the schedule.",
    symptoms: ["Often none — that is the point of screening"],
    riskFactors: ["Family history", "Smoking", "High body weight", "Sedentary lifestyle"],
    prevention: [
      "Keep a record of previous results",
      "Review blood pressure regularly",
      "Discuss age-appropriate screening with a clinician",
      "Keep vaccinations up to date as advised",
    ],
    seekHelp: ["Any new persistent symptom", "Abnormal screening results"],
    faqs: [
      {
        q: "How often should I have a check-up?",
        a: "It varies by individual risk. A licensed clinician can recommend the right interval for you.",
      },
    ],
  },
  {
    slug: "first-aid-basics",
    title: "Everyday First Aid Basics",
    category: "First Aid",
    summary: "General information about common minor situations.",
    overview:
      "Basic first aid can help in minor injuries while professional help is arranged. In any serious situation, contact local emergency services immediately.",
    symptoms: ["Minor cuts", "Small burns", "Sprains", "Nosebleeds"],
    riskFactors: ["Home and workplace hazards", "Sports without protective gear"],
    prevention: [
      "Keep a stocked first aid kit",
      "Learn a certified first aid course",
      "Keep emergency contacts accessible",
    ],
    seekHelp: [
      "Heavy bleeding that does not stop",
      "Loss of consciousness",
      "Difficulty breathing",
      "Suspected fracture or head injury",
    ],
    faqs: [
      {
        q: "Should I move an injured person?",
        a: "Avoid moving someone with a suspected spine or head injury unless they are in immediate danger, and call local emergency services.",
      },
    ],
  },
  {
    slug: "healthy-lifestyle",
    title: "Sustainable Healthy Habits",
    category: "Healthy Lifestyle",
    summary: "Small changes that add up over time.",
    overview:
      "Long-term health is driven by repeated small choices: sleep, movement, food, stress management, and avoiding tobacco and excess alcohol.",
    symptoms: ["Low energy", "Poor concentration", "Frequent minor illness"],
    riskFactors: ["Smoking", "Excess alcohol", "Chronic stress", "Sedentary routine"],
    prevention: [
      "Change one habit at a time",
      "Track progress simply",
      "Build routines around existing habits",
      "Plan for setbacks",
    ],
    seekHelp: ["Difficulty stopping tobacco or alcohol use", "Persistent fatigue"],
    faqs: [
      {
        q: "How long until habits stick?",
        a: "It varies widely between people. Consistency over weeks matters more than intensity in the first days.",
      },
    ],
  },
  {
    slug: "womens-health",
    title: "Women's Health Essentials",
    category: "Women's Health",
    summary: "General information on cycles, screening and wellbeing.",
    overview:
      "Women's health spans menstrual health, reproductive health, bone health and age-related screening. Individual needs vary widely and should be discussed with a clinician.",
    symptoms: ["Irregular cycles", "Severe menstrual pain", "Unusual bleeding", "Pelvic discomfort"],
    riskFactors: ["Family history", "Hormonal conditions", "Low physical activity"],
    prevention: [
      "Track cycle patterns",
      "Discuss age-appropriate screening",
      "Support bone health with activity and nutrition",
    ],
    seekHelp: [
      "Bleeding between cycles",
      "Severe pain affecting daily life",
      "Any new breast change",
    ],
    faqs: [
      {
        q: "Are irregular cycles always a problem?",
        a: "Not always, but persistent irregularity is worth discussing with a healthcare professional.",
      },
    ],
  },
  {
    slug: "mens-health",
    title: "Men's Health Essentials",
    category: "Men's Health",
    summary: "Common areas of focus and when to get checked.",
    overview:
      "Men's health commonly focuses on cardiovascular risk, metabolic health, prostate health with age and mental wellbeing. Routine checks help detect issues early.",
    symptoms: ["Reduced energy", "Urinary changes", "Chest discomfort on exertion"],
    riskFactors: ["Smoking", "High blood pressure", "Family history", "Sedentary work"],
    prevention: [
      "Monitor blood pressure",
      "Stay physically active",
      "Discuss age-appropriate screening",
      "Prioritise mental wellbeing",
    ],
    seekHelp: [
      "Chest discomfort, especially with activity",
      "Persistent urinary changes",
      "Unexplained weight loss",
    ],
    faqs: [
      {
        q: "When should screening start?",
        a: "It depends on personal and family risk. A licensed clinician can advise on timing.",
      },
    ],
  },
];

export const DISCLAIMER_TEXT =
  "Disclaimer: MediSage AI is an educational and decision-support tool. It does not provide a definitive medical diagnosis and is not a substitute for a qualified healthcare professional. AI-generated information may be incomplete or inaccurate. For medical concerns, consult a licensed healthcare professional. In an emergency, seek immediate professional medical help.";

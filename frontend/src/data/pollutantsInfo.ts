export interface PollutantInfo {
  code: string;
  name: string;
  chemicalFormula: string;
  category: 'Particulate' | 'Combustion Gas' | 'Photochemical Gas' | 'Agricultural Gas';
  sizeComparison?: string;
  simpleExplanation: string;
  primarySources: string[];
  healthEffects: string[];
  sensitiveGroups: string;
  safeLimitCpcb: string;
  whoGuideline: string;
}

export const POLLUTANTS_INFO: Record<string, PollutantInfo> = {
  pm25: {
    code: 'pm25',
    name: 'Fine Particulate Matter',
    chemicalFormula: 'PM₂.₅',
    category: 'Particulate',
    sizeComparison: '30 times thinner than a single strand of human hair (≤ 2.5 µm)',
    simpleExplanation:
      'Microscopic airborne specks small enough to bypass the respiratory defenses of your nose and throat, penetrating deep into lung alveoli and directly entering the bloodstream.',
    primarySources: [
      'Vehicle engine combustion (especially diesel)',
      'Crop stubble and biomass burning',
      'Coal-fired thermal power plants',
      'Road dust, tire wear, and construction demolition',
    ],
    healthEffects: [
      'Triggers acute asthma attacks and chronic bronchitis',
      'Increases long-term risk of heart attack and stroke',
      'Systemic arterial inflammation and reduced lung capacity',
    ],
    sensitiveGroups: 'Children, elderly, expectant mothers, and individuals with cardiovascular or respiratory ailments.',
    safeLimitCpcb: '60 µg/m³ (24-hour average)',
    whoGuideline: '15 µg/m³ (24-hour average)',
  },
  pm10: {
    code: 'pm10',
    name: 'Coarse Particulate Matter',
    chemicalFormula: 'PM₁₀',
    category: 'Particulate',
    sizeComparison: 'Roughly 1/5th the width of a human hair (≤ 10 µm)',
    simpleExplanation:
      'Inhalable dust and smoke particles. While larger than PM2.5, they readily settle in the upper airways, trachea, and bronchi.',
    primarySources: [
      'Unpaved roads and construction sites',
      'Industrial crushing and grinding operations',
      'Windblown agricultural dust and open trash incineration',
    ],
    healthEffects: [
      'Persistent coughing, wheezing, and throat irritation',
      'Aggravation of allergic rhinitis and sinus inflammation',
      'Eye and nasal stinging',
    ],
    sensitiveGroups: 'People suffering from asthma, chronic obstructive pulmonary disease (COPD), and allergic sinusitis.',
    safeLimitCpcb: '100 µg/m³ (24-hour average)',
    whoGuideline: '45 µg/m³ (24-hour average)',
  },
  no2: {
    code: 'no2',
    name: 'Nitrogen Dioxide',
    chemicalFormula: 'NO₂',
    category: 'Combustion Gas',
    sizeComparison: 'Gaseous molecule',
    simpleExplanation:
      'A pungent, reddish-brown gas formed when fuel burns at high temperatures. It is a key ingredient in urban smog and a precursor to acid rain.',
    primarySources: [
      'Motor vehicle exhaust (traffic congestion)',
      'Industrial boilers and gas turbines',
      'Indoor unvented gas heaters and kerosene stoves',
    ],
    healthEffects: [
      'Causes intense inflammation of airways',
      'Increases susceptibility to respiratory viral infections',
      'Induces bronchial hyper-responsiveness in children',
    ],
    sensitiveGroups: 'Asthmatic patients and children residing near major transit highways.',
    safeLimitCpcb: '80 µg/m³ (24-hour average)',
    whoGuideline: '25 µg/m³ (24-hour average)',
  },
  so2: {
    code: 'so2',
    name: 'Sulfur Dioxide',
    chemicalFormula: 'SO₂',
    category: 'Combustion Gas',
    sizeComparison: 'Gaseous molecule',
    simpleExplanation:
      'A sharp, acrid gas produced when sulfur-bearing fuels like coal and crude oil are burned.',
    primarySources: [
      'Coal-fired thermal electricity stations',
      'Petrochemical refineries and metal smelting plants',
      'Heavy industrial manufacturing',
    ],
    healthEffects: [
      'Triggers rapid bronchoconstriction and throat tightness',
      'Burning sensation in eyes, nose, and throat',
      'Precursor to secondary sulfate PM2.5 aerosols',
    ],
    sensitiveGroups: 'People with chronic bronchitis, emphysema, or exercise-induced asthma.',
    safeLimitCpcb: '80 µg/m³ (24-hour average)',
    whoGuideline: '40 µg/m³ (24-hour average)',
  },
  co: {
    code: 'co',
    name: 'Carbon Monoxide',
    chemicalFormula: 'CO',
    category: 'Combustion Gas',
    sizeComparison: 'Gaseous molecule',
    simpleExplanation:
      'A silent, colorless, and odorless gas produced when carbon-based fuels burn incompletely.',
    primarySources: [
      'Motor vehicles idling in stop-and-go traffic',
      'Defective gas heaters and poorly ventilated fire stoves',
      'Cigarette smoke and biomass burning',
    ],
    healthEffects: [
      'Binds tightly to hemoglobin, suffocating oxygen delivery to body tissues',
      'Causes headaches, dizziness, impaired reaction times, and nausea',
      'Dangerous strain on cardiovascular patients during physical exertion',
    ],
    sensitiveGroups: 'Individuals with coronary artery disease and fetuses/newborns.',
    safeLimitCpcb: '2 mg/m³ (8-hour average) / 4 mg/m³ (1-hour average)',
    whoGuideline: '4 mg/m³ (24-hour average)',
  },
  o3: {
    code: 'o3',
    name: 'Ground-Level Ozone',
    chemicalFormula: 'O₃',
    category: 'Photochemical Gas',
    sizeComparison: 'Gaseous molecule',
    simpleExplanation:
      'Not emitted directly; instead, it is cooked in the air when vehicle exhaust (NOx) and chemicals (VOCs) react under hot, sunny conditions. Helpful in the stratosphere, harmful at ground level.',
    primarySources: [
      'Photochemical reactions between traffic exhaust and summer sunlight',
      'Industrial chemical evaporations and paint solvents',
      'Gasoline vapors from refueling stations',
    ],
    healthEffects: [
      'Severely irritates mucous membranes and triggers deep lung sunburn',
      'Causes shortness of breath and chest pain during deep inhalation',
      'Reduces lung vital capacity and damages vegetation and crop yields',
    ],
    sensitiveGroups: 'Outdoor athletes, children playing outdoors in afternoons, and outdoor laborers.',
    safeLimitCpcb: '100 µg/m³ (8-hour average)',
    whoGuideline: '100 µg/m³ (8-hour average)',
  },
  nh3: {
    code: 'nh3',
    name: 'Ammonia',
    chemicalFormula: 'NH₃',
    category: 'Agricultural Gas',
    sizeComparison: 'Gaseous molecule',
    simpleExplanation:
      'A pungent, alkaline gas primarily released from agricultural manure, nitrogen fertilizers, and livestock waste.',
    primarySources: [
      'Synthetic nitrogen fertilizer application in agricultural fields',
      'Dairy farms and livestock manure storage',
      'Untreated sewage canals and municipal solid waste heaps',
    ],
    healthEffects: [
      'Reacts with atmospheric acids to form secondary fine PM2.5 particulates',
      'Eye irritation, lacrimation, and respiratory discomfort at higher exposures',
    ],
    sensitiveGroups: 'Farmers, agricultural workers, and communities downwind of cattle livestock facilities.',
    safeLimitCpcb: '400 µg/m³ (24-hour average)',
    whoGuideline: 'None specific (regulated under PM2.5 secondary formation)',
  },
};


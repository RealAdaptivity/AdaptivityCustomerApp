/** Bookable services + quote hold rules (keep in sync with adaptivity-performance). Auto-synced. */

export type ServiceKind =
  | 'diagnostic'
  | 'oil_change'
  | 'brakes'
  | 'transmission_oil'
  | 'differential'
  | 'battery'
  | 'ac_service'
  | 'suspension'
  | 'exhaust_repair'
  | 'cooling_system'
  | 'belts_hoses'
  | 'ignition'
  | 'fuel_system'
  | 'tires'
  | 'wheel_service'
  | 'auto_glass'
  | 'car_audio'
  | 'window_tint'
  | 'vehicle_wrap'
  | 'ppf'
  | 'body_work'
  | 'interior_lighting'
  | 'interior_color'
  | 'accessories'
  | 'mobile_detailing'
  | 'ceramic_coating'
  | 'paint_correction'
  | 'headlight_restore'
  | 'performance_tune'
  | 'intake_exhaust_upgrade'
  | 'other';

export type CatalogService = {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  kind: ServiceKind;
  directBook: boolean;
  category: 'inspection' | 'maintenance' | 'brakes' | 'fluids' | 'audio' | 'appearance' | 'body' | 'modification' | 'detailing' | 'tires' | 'glass' | 'performance';
  typicalMinDollars?: number;
  typicalMaxDollars?: number;
};

export function formatCatalogPriceRange(s: Pick<CatalogService, 'typicalMinDollars' | 'typicalMaxDollars'>): string | null {
  if (s.typicalMinDollars == null || s.typicalMaxDollars == null) return null;
  return `Typically $${s.typicalMinDollars}–$${s.typicalMaxDollars}`;
}

export const DIRECT_BOOK_KINDS: ServiceKind[] = [];

export const DIAGNOSTIC_HOLD_DOLLARS = 85;

export const SERVICE_CATALOG: CatalogService[] = [
  {
    "id": "diagnostic",
    "title": "Mobile Diagnostic Visit",
    "description": "$85 diagnostic hold. Tech inspects on site and sets labor + parts pricing before any repair charge.",
    "price": 85,
    "duration": "45–60 mins",
    "icon": "🔍",
    "kind": "diagnostic",
    "directBook": false,
    "typicalMinDollars": 85,
    "typicalMaxDollars": 85,
    "category": "inspection"
  },
  {
    "id": "oil_change",
    "title": "Full Synthetic Mobile Oil Change",
    "description": "Euro synthetic oil + OEM filter + multi-point check. Final price set by your tech on site.",
    "price": 100,
    "duration": "45 mins+",
    "icon": "🛢️",
    "kind": "oil_change",
    "directBook": false,
    "typicalMinDollars": 89,
    "typicalMaxDollars": 160,
    "category": "maintenance"
  },
  {
    "id": "brakes",
    "title": "Brake Service (Pads / Rotors)",
    "description": "Pads, rotors, sensors as needed. Tech diagnoses wear on site and sets labor + parts pricing.",
    "price": 100,
    "duration": "1–3 hrs",
    "icon": "🛑",
    "kind": "brakes",
    "directBook": false,
    "typicalMinDollars": 280,
    "typicalMaxDollars": 650,
    "category": "brakes"
  },
  {
    "id": "transmission_oil",
    "title": "Transmission Fluid Service",
    "description": "Fluid service — final price set by your tech on site after confirming fluid type.",
    "price": 100,
    "duration": "1–2 hrs",
    "icon": "⚙️",
    "kind": "transmission_oil",
    "directBook": false,
    "typicalMinDollars": 180,
    "typicalMaxDollars": 350,
    "category": "fluids"
  },
  {
    "id": "differential",
    "title": "Differential Fluid Service",
    "description": "Diff fluid service — final price set by tech on site.",
    "price": 100,
    "duration": "1–2 hrs",
    "icon": "🔧",
    "kind": "differential",
    "directBook": false,
    "typicalMinDollars": 140,
    "typicalMaxDollars": 280,
    "category": "fluids"
  },
  {
    "id": "battery",
    "title": "Battery / Charging System",
    "description": "$100 on-site test. Mechanical tech diagnoses battery, alternator, or starter issues and quotes before parts/install.",
    "price": 100,
    "duration": "30–45 mins",
    "icon": "🔋",
    "kind": "battery",
    "directBook": false,
    "typicalMinDollars": 180,
    "typicalMaxDollars": 420,
    "category": "maintenance"
  },
  {
    "id": "ac_service",
    "title": "A/C & Climate Service",
    "description": "$100 on-site A/C assessment. Diagnose cooling, recharge needs, or HVAC issues before repair charge.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "❄️",
    "kind": "ac_service",
    "directBook": false,
    "typicalMinDollars": 150,
    "typicalMaxDollars": 450,
    "category": "maintenance"
  },
  {
    "id": "suspension",
    "title": "Suspension & Ride Control",
    "description": "$100 on-site inspection. Shocks, struts, bushings, or alignment concerns quoted after assessment.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🛣️",
    "kind": "suspension",
    "directBook": false,
    "typicalMinDollars": 250,
    "typicalMaxDollars": 900,
    "category": "maintenance"
  },
  {
    "id": "exhaust_repair",
    "title": "Exhaust Repair",
    "description": "$100 on-site inspection. Mufflers, pipes, catalytic issues, and leaks assessed before repair quote.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "💨",
    "kind": "exhaust_repair",
    "directBook": false,
    "typicalMinDollars": 200,
    "typicalMaxDollars": 800,
    "category": "maintenance"
  },
  {
    "id": "cooling_system",
    "title": "Cooling System / Overheating",
    "description": "$100 on-site cooling check. Radiator, thermostat, water pump, and leak concerns quoted after inspection.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🌡️",
    "kind": "cooling_system",
    "directBook": false,
    "typicalMinDollars": 180,
    "typicalMaxDollars": 700,
    "category": "maintenance"
  },
  {
    "id": "belts_hoses",
    "title": "Belts & Hoses",
    "description": "$100 on-site inspection. Serpentine belts, tensioners, and hose replacements quoted before work.",
    "price": 100,
    "duration": "30–45 mins",
    "icon": "🔗",
    "kind": "belts_hoses",
    "directBook": false,
    "typicalMinDollars": 120,
    "typicalMaxDollars": 350,
    "category": "maintenance"
  },
  {
    "id": "ignition",
    "title": "Ignition / Spark Plugs",
    "description": "$100 on-site assessment. Misfires, plugs, coils, and ignition issues quoted before repair.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "⚡",
    "kind": "ignition",
    "directBook": false,
    "typicalMinDollars": 150,
    "typicalMaxDollars": 480,
    "category": "maintenance"
  },
  {
    "id": "fuel_system",
    "title": "Fuel System Service",
    "description": "$100 on-site assessment. Fuel filters, injectors, pumps, and related concerns quoted after inspection.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "⛽",
    "kind": "fuel_system",
    "directBook": false,
    "typicalMinDollars": 200,
    "typicalMaxDollars": 650,
    "category": "maintenance"
  },
  {
    "id": "tires",
    "title": "Tires — Mount / Balance / Flat",
    "description": "$100 on-site tire service consult. Mount, balance, rotation, puncture repair, or TPMS quoted before work.",
    "price": 100,
    "duration": "30–60 mins",
    "icon": "🛞",
    "kind": "tires",
    "directBook": false,
    "typicalMinDollars": 40,
    "typicalMaxDollars": 200,
    "category": "tires"
  },
  {
    "id": "wheel_service",
    "title": "Wheels & Alignment Concern",
    "description": "$100 on-site wheel/alignment assessment. Vibration, curb rash, or alignment needs quoted before service.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "⭕",
    "kind": "wheel_service",
    "directBook": false,
    "typicalMinDollars": 100,
    "typicalMaxDollars": 350,
    "category": "tires"
  },
  {
    "id": "auto_glass",
    "title": "Auto Glass / Windshield",
    "description": "$100 on-site glass assessment. Chip repair or windshield / side glass replacement quoted before work.",
    "price": 100,
    "duration": "30–45 mins",
    "icon": "🪟",
    "kind": "auto_glass",
    "directBook": false,
    "typicalMinDollars": 80,
    "typicalMaxDollars": 450,
    "category": "glass"
  },
  {
    "id": "car_audio",
    "title": "Car Audio Install / Upgrade",
    "description": "$100 on-site consult. Speakers, head unit, amp, or full system quoted before install.",
    "price": 100,
    "duration": "45–90 mins consult",
    "icon": "🔊",
    "kind": "car_audio",
    "directBook": false,
    "typicalMinDollars": 200,
    "typicalMaxDollars": 1500,
    "category": "audio"
  },
  {
    "id": "window_tint",
    "title": "Window Tint",
    "description": "$100 on-site measure. Tint film options quoted and installed after you approve.",
    "price": 100,
    "duration": "30–45 mins measure",
    "icon": "🕶️",
    "kind": "window_tint",
    "directBook": false,
    "category": "appearance"
  },
  {
    "id": "vehicle_wrap",
    "title": "Vehicle Wrap",
    "description": "$100 on-site consult. Full or partial vinyl wrap options quoted before film work.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🎨",
    "kind": "vehicle_wrap",
    "directBook": false,
    "category": "appearance"
  },
  {
    "id": "ppf",
    "title": "Paint Protection Film (PPF)",
    "description": "$100 on-site consult. Clear bra / PPF coverage areas quoted before install.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🛡️",
    "kind": "ppf",
    "directBook": false,
    "category": "appearance"
  },
  {
    "id": "body_work",
    "title": "Body Work / Dent Repair",
    "description": "$100 on-site assessment. Dents, panels, or cosmetic damage quoted before body work charge.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🚗",
    "kind": "body_work",
    "directBook": false,
    "category": "body"
  },
  {
    "id": "interior_lighting",
    "title": "Interior Lighting Upgrade",
    "description": "$100 on-site consult. Ambient LED, footwell, dome, or custom interior lighting quoted before install.",
    "price": 100,
    "duration": "30–60 mins consult",
    "icon": "💡",
    "kind": "interior_lighting",
    "directBook": false,
    "category": "modification"
  },
  {
    "id": "interior_color",
    "title": "Interior Color Change",
    "description": "$100 on-site consult. Dash, trim, or cabin color refresh options quoted before work.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "✨",
    "kind": "interior_color",
    "directBook": false,
    "category": "modification"
  },
  {
    "id": "accessories",
    "title": "Accessories & Custom Install",
    "description": "$100 on-site consult. Running boards, racks, cameras, remote start, or other accessories quoted before install.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🧰",
    "kind": "accessories",
    "directBook": false,
    "category": "modification"
  },
  {
    "id": "mobile_detailing",
    "title": "Mobile Detailing",
    "description": "$100 on-site consult. Interior, exterior, or full mobile detail packages quoted before service.",
    "price": 100,
    "duration": "30–45 mins consult",
    "icon": "🧽",
    "kind": "mobile_detailing",
    "directBook": false,
    "category": "detailing"
  },
  {
    "id": "ceramic_coating",
    "title": "Ceramic Coating",
    "description": "$100 on-site paint assessment. Ceramic coating packages quoted before application.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "💎",
    "kind": "ceramic_coating",
    "directBook": false,
    "category": "detailing"
  },
  {
    "id": "paint_correction",
    "title": "Paint Correction",
    "description": "$100 on-site paint inspection. Swirl / scratch correction scope quoted before polish work.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "✨",
    "kind": "paint_correction",
    "directBook": false,
    "category": "detailing"
  },
  {
    "id": "headlight_restore",
    "title": "Headlight Restoration",
    "description": "$100 on-site check. Cloudy / yellowed headlight restore quoted before service.",
    "price": 100,
    "duration": "30–45 mins",
    "icon": "💡",
    "kind": "headlight_restore",
    "directBook": false,
    "category": "detailing"
  },
  {
    "id": "performance_tune",
    "title": "Performance Tune / Calibration",
    "description": "$100 on-site consult. ECU tune, calibration, or performance programming quoted before work.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🏎️",
    "kind": "performance_tune",
    "directBook": false,
    "category": "performance"
  },
  {
    "id": "intake_exhaust_upgrade",
    "title": "Intake / Exhaust Upgrade",
    "description": "$100 on-site consult. Performance intake or exhaust upgrades quoted before install.",
    "price": 100,
    "duration": "45–60 mins consult",
    "icon": "🔥",
    "kind": "intake_exhaust_upgrade",
    "directBook": false,
    "category": "performance"
  }
];

export function getCatalogById(id: string): CatalogService | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

export function matchCatalogFromLabel(label: string): CatalogService | undefined {
  const t = label.toLowerCase();
  if (/\b(brake|brakes|pads|rotors)\b/.test(t)) return getCatalogById('brakes');
  if (/\b(transmission|trans)\b/.test(t) && /\b(oil|fluid)\b/.test(t)) {
    return getCatalogById('transmission_oil');
  }
  if (/\bdifferential|diff\b/.test(t) && /\b(oil|fluid|change|service)\b/.test(t)) {
    return getCatalogById('differential');
  }
  if (/\b(battery|alternator|starter|jump\s*start|charging\s*system)\b/.test(t)) {
    return getCatalogById('battery');
  }
  if (/\b(a\/?c|air\s*condition|climate|freon|refrigerant)\b/.test(t)) {
    return getCatalogById('ac_service');
  }
  if (/\b(suspension|shock|strut|alignment|bushing)\b/.test(t)) {
    return getCatalogById('suspension');
  }
  if (/\b(exhaust|muffler|catalytic)\b/.test(t) && !/\b(upgrade|performance|intake)\b/.test(t)) {
    return getCatalogById('exhaust_repair');
  }
  if (/\b(coolant|radiator|overheat|thermostat|water\s*pump)\b/.test(t)) {
    return getCatalogById('cooling_system');
  }
  if (/\b(belt|serpentine|hose|tensioner)\b/.test(t)) return getCatalogById('belts_hoses');
  if (/\b(spark\s*plug|ignition|coil|misfire)\b/.test(t)) return getCatalogById('ignition');
  if (/\b(fuel\s*(system|filter|pump|injector)|injectors)\b/.test(t)) {
    return getCatalogById('fuel_system');
  }
  if (/\b(tire|tyre|flat|puncture|tpms|mount|balance|rotation)\b/.test(t)) {
    return getCatalogById('tires');
  }
  if (/\b(wheel|rim|curb\s*rash)\b/.test(t)) return getCatalogById('wheel_service');
  if (/\b(windshield|windscreen|auto\s*glass|chip\s*repair|glass)\b/.test(t)) {
    return getCatalogById('auto_glass');
  }
  if (/\b(tint|window\s*tint|ceramic\s*tint)\b/.test(t)) return getCatalogById('window_tint');
  if (/\b(ppf|paint\s*protection|clear\s*bra)\b/.test(t)) return getCatalogById('ppf');
  if (/\b(interior\s*light|ambient\s*light|footwell|cabin\s*light|led\s*interior)\b/.test(t)) {
    return getCatalogById('interior_lighting');
  }
  if (/\b(interior\s*color|cabin\s*color|dash\s*color|trim\s*color|recolor)\b/.test(t)) {
    return getCatalogById('interior_color');
  }
  if (/\b(accessor|remote\s*start|running\s*board|roof\s*rack|backup\s*camera)\b/.test(t)) {
    return getCatalogById('accessories');
  }
  if (/\b(ceramic\s*coat)\b/.test(t)) return getCatalogById('ceramic_coating');
  if (/\b(paint\s*correction|swirl|polish)\b/.test(t)) return getCatalogById('paint_correction');
  if (/\b(headlight\s*restor|headlamp\s*restor)\b/.test(t)) return getCatalogById('headlight_restore');
  if (/\b(detail|detailing|mobile\s*detail|wash\s*and\s*wax)\b/.test(t)) {
    return getCatalogById('mobile_detailing');
  }
  if (/\b(tune|ecu|calibration|dyno)\b/.test(t)) return getCatalogById('performance_tune');
  if (/\b(intake|performance\s*exhaust|cat[\s-]?back)\b/.test(t)) {
    return getCatalogById('intake_exhaust_upgrade');
  }
  if (/\b(wrap|vinyl\s*wrap|vehicle\s*wrap)\b/.test(t)) return getCatalogById('vehicle_wrap');
  if (/\b(body\s*work|bodywork|dent|dents|collision|paintless|pdr|fender|bumper\s*repair)\b/.test(t)) {
    return getCatalogById('body_work');
  }
  if (/\b(audio|stereo|speaker|head\s*unit|subwoofer|car\s*audio)\b/.test(t)) {
    return getCatalogById('car_audio');
  }
  if (/\boil\b/.test(t) && !/\btransmission\b/.test(t)) return getCatalogById('oil_change');
  if (/\bdiagnostic|dvi|inspection|scan|check\s*engine\b/.test(t)) {
    return getCatalogById('diagnostic');
  }
  return undefined;
}

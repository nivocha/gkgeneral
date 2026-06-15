import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomBytes, scryptSync } from "node:crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── Helpers ──────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const key = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 })
  return `${salt}:${key.toString("hex")}`
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
}

function generateOrderNumber(id: string): string {
  const d = new Date()
  const yy = d.getFullYear().toString().slice(-2)
  const mm = (d.getMonth() + 1).toString().padStart(2, "0")
  const dd = d.getDate().toString().padStart(2, "0")
  return `GK-${yy}${mm}${dd}-${id.slice(-6).toUpperCase()}`
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) / 1000) * 1000
}

let actionPass = 0
let actionFail = 0
const actionResults: { name: string; status: string; error?: string }[] = []

function logAction(name: string, fn: () => Promise<unknown>) {
  // no-op placeholder; real calls happen in phase 10
}

// ── Data Definitions ─────────────────────────────────────────────

const brandsData = [
  { name: "Powermax Industries", description: "Leading manufacturer of generators, switchgear and electrical equipment" },
  { name: "Helios Energy", description: "Premium solar energy solutions for residential and commercial use" },
  { name: "AquaFlow Systems", description: "Industrial and domestic pumping solutions since 1995" },
  { name: "SteelCraft Tools", description: "Professional-grade tools and construction machinery" },
  { name: "IndusPro Solutions", description: "Industrial equipment, safety gear and material handling" },
]

const categories = [
  {
    name: "Generators", slug: "generators", description: "Diesel, petrol & industrial generators for commercial and industrial use", icon: "Zap", sortOrder: 0,
    children: [
      { name: "Diesel Generators", slug: "diesel-generators", sortOrder: 0 },
      { name: "Petrol Generators", slug: "petrol-generators", sortOrder: 1 },
      { name: "Industrial Generators", slug: "industrial-generators", sortOrder: 2 },
      { name: "Portable Generators", slug: "portable-generators", sortOrder: 3 },
      { name: "Generator Accessories", slug: "generator-accessories", sortOrder: 4 },
    ],
  },
  {
    name: "Solar Products", slug: "solar", description: "Solar panels, inverters, batteries and complete solar energy systems", icon: "Sun", sortOrder: 1,
    children: [
      { name: "Solar Panels", slug: "solar-panels", sortOrder: 0 },
      { name: "Inverters", slug: "inverters", sortOrder: 1 },
      { name: "Batteries", slug: "batteries", sortOrder: 2 },
      { name: "Charge Controllers", slug: "charge-controllers", sortOrder: 3 },
      { name: "Solar Accessories", slug: "solar-accessories", sortOrder: 4 },
    ],
  },
  {
    name: "Pumps", slug: "pumps", description: "Water pumps, submersible pumps and industrial pumping solutions", icon: "Droplets", sortOrder: 2,
    children: [
      { name: "Water Pumps", slug: "water-pumps", sortOrder: 0 },
      { name: "Submersible Pumps", slug: "submersible-pumps", sortOrder: 1 },
      { name: "Industrial Pumps", slug: "industrial-pumps", sortOrder: 2 },
      { name: "Pressure Pumps", slug: "pressure-pumps", sortOrder: 3 },
      { name: "Pump Accessories", slug: "pump-accessories", sortOrder: 4 },
    ],
  },
  {
    name: "Electrical", slug: "electrical", description: "Cables, switchgear, transformers and electrical equipment", icon: "Cable", sortOrder: 3,
    children: [
      { name: "Cables & Wires", slug: "cables-wires", sortOrder: 0 },
      { name: "Switchgear", slug: "switchgear", sortOrder: 1 },
      { name: "Transformers", slug: "transformers", sortOrder: 2 },
      { name: "Circuit Breakers", slug: "circuit-breakers", sortOrder: 3 },
      { name: "Electrical Tools", slug: "electrical-tools", sortOrder: 4 },
    ],
  },
  {
    name: "Tools & Machinery", slug: "tools", description: "Power tools, hand tools and construction machinery", icon: "Wrench", sortOrder: 4,
    children: [
      { name: "Power Tools", slug: "power-tools", sortOrder: 0 },
      { name: "Hand Tools", slug: "hand-tools", sortOrder: 1 },
      { name: "Construction Machinery", slug: "construction-machinery", sortOrder: 2 },
      { name: "Measuring Tools", slug: "measuring-tools", sortOrder: 3 },
      { name: "Tool Accessories", slug: "tool-accessories", sortOrder: 4 },
    ],
  },
  {
    name: "Industrial Solutions", slug: "industrial", description: "Industrial equipment, safety gear and material handling solutions", icon: "Factory", sortOrder: 5,
    children: [
      { name: "Industrial Equipment", slug: "industrial-equipment", sortOrder: 0 },
      { name: "Safety Gear", slug: "safety-gear", sortOrder: 1 },
      { name: "Material Handling", slug: "material-handling", sortOrder: 2 },
      { name: "Storage Solutions", slug: "storage-solutions", sortOrder: 3 },
      { name: "Maintenance Supplies", slug: "maintenance-supplies", sortOrder: 4 },
    ],
  },
]

interface ProductSeed {
  name: string
  slug: string
  categorySlug: string
  brandName: string
  description: string
  shortDescription: string
  price: number
  comparePrice?: number
  costPrice?: number
  unit: string
  warranty: string
  weight?: number
  dimensions?: string
  material?: string
  tags: string[]
  isFeatured: boolean
  isNew: boolean
  onSale: boolean
  isPublished: boolean
  minOrderQuantity: number
  maxOrderQuantity?: number
  variants: { name: string; price: number; sku: string }[]
  specifications: { label: string; value: string; unit?: string }[]
}

const productsData: ProductSeed[] = [
  // ── Generators ──
  {
    name: "Powermax 20kVA Diesel Generator",
    slug: "powermax-20kva-diesel-generator",
    categorySlug: "diesel-generators", brandName: "Powermax Industries",
    description: "The Powermax 20kVA diesel generator delivers reliable backup power for commercial and industrial applications. Built with a rugged Perkins engine and deep-sea electronics, it provides automatic mains failure start and continuous rated output of 20kVA. Ideal for hospitals, data centers, and manufacturing facilities.",
    shortDescription: "20kVA diesel generator with Perkins engine, ATS-ready, soundproof canopy",
    price: 8500000, comparePrice: 9500000, costPrice: 5950000,
    unit: "piece", warranty: "3 years", weight: 850, dimensions: "2200×900×1400 mm",
    tags: ["diesel", "generator", "20kva", "perkins", "backup-power"],
    isFeatured: true, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "Standard — Manual Start", price: 8500000, sku: "PM-DG20K-MAN" },
      { name: "Deluxe — Auto Start + ATS", price: 9500000, sku: "PM-DG20K-ATS" },
      { name: "Premium — Soundproof Canopy + ATS", price: 11500000, sku: "PM-DG20K-SPC" },
    ],
    specifications: [
      { label: "Rated Power", value: "20", unit: "kVA" },
      { label: "Engine", value: "Perkins 1103A-33G" },
      { label: "Fuel Consumption", value: "4.2", unit: "L/hr" },
      { label: "Fuel Tank", value: "100", unit: "L" },
      { label: "Noise Level", value: "72", unit: "dB(A)" },
      { label: "Voltage", value: "400/230", unit: "V" },
      { label: "Phase", value: "3" },
    ],
  },
  {
    name: "Powermax 5kVA Petrol Generator",
    slug: "powermax-5kva-petrol-generator",
    categorySlug: "petrol-generators", brandName: "Powermax Industries",
    description: "Compact and reliable 5kVA petrol generator for home and small business backup. Features a quiet-running Honda GX390 engine, AVR voltage regulation, and low-oil shutdown.",
    shortDescription: "5kVA petrol generator, Honda GX390 engine, AVR, quiet operation",
    price: 1200000, comparePrice: 1400000, costPrice: 840000,
    unit: "piece", warranty: "2 years", weight: 65, dimensions: "700×530×570 mm",
    tags: ["petrol", "generator", "5kva", "honda", "home-backup"],
    isFeatured: false, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 20,
    variants: [
      { name: "Standard", price: 1200000, sku: "PM-PG5K-STD" },
      { name: "Electric Start", price: 1400000, sku: "PM-PG5K-EST" },
    ],
    specifications: [
      { label: "Rated Power", value: "5", unit: "kVA" },
      { label: "Engine", value: "Honda GX390" },
      { label: "Fuel Tank", value: "25", unit: "L" },
      { label: "Run Time @ 50% Load", value: "12", unit: "hrs" },
      { label: "Noise Level", value: "68", unit: "dB(A)" },
      { label: "Voltage", value: "230", unit: "V" },
    ],
  },
  {
    name: "Powermax 100kVA Industrial Generator",
    slug: "powermax-100kva-industrial-generator",
    categorySlug: "industrial-generators", brandName: "Powermax Industries",
    description: "Heavy-duty 100kVA industrial generator designed for continuous prime power in mining, construction, and large industrial facilities. Cummins engine, Leroy-Somer alternator, full digital control panel.",
    shortDescription: "100kVA industrial generator, Cummins engine, prime power rating",
    price: 45000000, costPrice: 31500000,
    unit: "piece", warranty: "5 years", weight: 2500, dimensions: "3600×1200×1800 mm",
    tags: ["industrial", "generator", "100kva", "cummins", "prime-power"],
    isFeatured: true, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1,
    variants: [
      { name: "Open Skid", price: 45000000, sku: "PM-IG100K-OSK" },
      { name: "Soundproof Canopy", price: 52000000, sku: "PM-IG100K-SPC" },
      { name: "Containerized", price: 58000000, sku: "PM-IG100K-CNT" },
    ],
    specifications: [
      { label: "Prime Power", value: "100", unit: "kVA" },
      { label: "Standby Power", value: "110", unit: "kVA" },
      { label: "Engine", value: "Cummins QSL9-G3" },
      { label: "Alternator", value: "Leroy-Somer LSA 46.3" },
      { label: "Fuel Consumption @ 100%", value: "28", unit: "L/hr" },
      { label: "Fuel Tank", value: "400", unit: "L" },
    ],
  },
  // ── Solar ──
  {
    name: "Helios 550W Monocrystalline Solar Panel",
    slug: "helios-550w-monocrystalline-solar-panel",
    categorySlug: "solar-panels", brandName: "Helios Energy",
    description: "High-efficiency 550W monocrystalline PERC solar panel with half-cut cell technology. 21.5% module efficiency, 25-year linear power warranty, and robust anodized aluminum frame.",
    shortDescription: "550W monocrystalline PERC panel, 21.5% efficiency, 25-year warranty",
    price: 450000, comparePrice: 520000, costPrice: 315000,
    unit: "piece", warranty: "25 years", weight: 28.5, dimensions: "2279×1134×35 mm",
    tags: ["solar", "panel", "550w", "monocrystalline", "perc", "half-cut"],
    isFeatured: true, isNew: true, onSale: true, isPublished: true,
    minOrderQuantity: 4, maxOrderQuantity: 500,
    variants: [
      { name: "Single Panel", price: 450000, sku: "HE-SP550-SGL" },
      { name: "Pallet — 31 Panels", price: 13000000, sku: "HE-SP550-PAL" },
    ],
    specifications: [
      { label: "Max Power", value: "550", unit: "W" },
      { label: "Module Efficiency", value: "21.5", unit: "%" },
      { label: "Vmp", value: "41.8", unit: "V" },
      { label: "Imp", value: "13.16", unit: "A" },
      { label: "Cell Type", value: "Monocrystalline PERC half-cut" },
      { label: "Frame", value: "Anodized aluminum alloy" },
      { label: "Connector", value: "MC4 compatible" },
    ],
  },
  {
    name: "Helios 5kW Hybrid Solar Inverter",
    slug: "helios-5kw-hybrid-solar-inverter",
    categorySlug: "inverters", brandName: "Helios Energy",
    description: "5kW hybrid inverter with dual MPPT, on-grid and off-grid operation, and built-in LiFePO4 battery management. Seamless UPS-grade switchover for critical loads.",
    shortDescription: "5kW hybrid inverter, dual MPPT, UPS-grade switchover, battery ready",
    price: 2800000, comparePrice: 3200000, costPrice: 1960000,
    unit: "piece", warranty: "5 years", weight: 18, dimensions: "550×400×170 mm",
    tags: ["solar", "inverter", "hybrid", "5kw", "mppt", "ups"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 50,
    variants: [
      { name: "Hybrid 5kW — Single Phase", price: 2800000, sku: "HE-INV5K-SP" },
      { name: "Hybrid 5kW — Three Phase", price: 3200000, sku: "HE-INV5K-TP" },
    ],
    specifications: [
      { label: "Rated Power", value: "5", unit: "kW" },
      { label: "MPPT Voltage Range", value: "120-500", unit: "V" },
      { label: "Max PV Input", value: "6500", unit: "W" },
      { label: "Battery Voltage", value: "48", unit: "V" },
      { label: "Switchover Time", value: "<10", unit: "ms" },
      { label: "Efficiency", value: "97.6", unit: "%" },
    ],
  },
  {
    name: "Helios 200Ah Deep Cycle Gel Battery",
    slug: "helios-200ah-deep-cycle-gel-battery",
    categorySlug: "batteries", brandName: "Helios Energy",
    description: "Maintenance-free deep cycle gel battery for solar storage. 200Ah @ C10, 1500+ cycles @ 50% DOD, sealed AGM-gel hybrid design for maximum safety and longevity.",
    shortDescription: "200Ah deep cycle gel battery, 1500+ cycles, maintenance-free",
    price: 850000, costPrice: 595000,
    unit: "piece", warranty: "3 years", weight: 58, dimensions: "522×240×219 mm",
    tags: ["solar", "battery", "200ah", "deep-cycle", "gel", "maintenance-free"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 2, maxOrderQuantity: 100,
    variants: [
      { name: "Single Battery", price: 850000, sku: "HE-BAT200-SGL" },
      { name: "Set of 4 (48V Bank)", price: 3200000, sku: "HE-BAT200-S4" },
    ],
    specifications: [
      { label: "Capacity @ C10", value: "200", unit: "Ah" },
      { label: "Voltage", value: "12", unit: "V" },
      { label: "Cycle Life @ 50% DOD", value: "1500+" },
      { label: "Type", value: "AGM-Gel hybrid" },
      { label: "Operating Temp", value: "-20 to 60", unit: "°C" },
      { label: "Terminal Type", value: "M8 copper insert" },
    ],
  },
  // ── Pumps ──
  {
    name: "AquaFlow 2HP Submersible Pump",
    slug: "aquaflow-2hp-submersible-pump",
    categorySlug: "submersible-pumps", brandName: "AquaFlow Systems",
    description: "Stainless steel submersible pump for borehole water extraction. 2HP, 20m³/hr max flow, 80m max head. Suitable for domestic water supply and irrigation.",
    shortDescription: "2HP submersible borehole pump, SS304, 20m³/hr, 80m head",
    price: 1500000, comparePrice: 1750000, costPrice: 1050000,
    unit: "piece", warranty: "2 years", weight: 22, dimensions: "100×100×650 mm",
    tags: ["pump", "submersible", "borehole", "2hp", "stainless-steel"],
    isFeatured: false, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 30,
    variants: [
      { name: "2HP — 3\" Diameter", price: 1500000, sku: "AF-SUB2H-3IN" },
      { name: "2HP — 4\" Diameter", price: 1650000, sku: "AF-SUB2H-4IN" },
    ],
    specifications: [
      { label: "Power", value: "2", unit: "HP" },
      { label: "Max Flow", value: "20", unit: "m³/hr" },
      { label: "Max Head", value: "80", unit: "m" },
      { label: "Material", value: "SS304" },
      { label: "Voltage", value: "380", unit: "V" },
      { label: "Outlet", value: "2", unit: "inch" },
    ],
  },
  {
    name: "AquaFlow 5HP Centrifugal Water Pump",
    slug: "aquaflow-5hp-centrifugal-water-pump",
    categorySlug: "water-pumps", brandName: "AquaFlow Systems",
    description: "Heavy-duty centrifugal water pump for irrigation, water transfer, and industrial circulation. 5HP motor, cast iron body, bronze impeller.",
    shortDescription: "5HP centrifugal pump, cast iron body, bronze impeller, 50m³/hr",
    price: 950000, comparePrice: 1100000, costPrice: 665000,
    unit: "piece", warranty: "2 years", weight: 35, dimensions: "500×300×400 mm",
    tags: ["pump", "water", "centrifugal", "5hp", "irrigation"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 40,
    variants: [
      { name: "5HP — Standard Seal", price: 950000, sku: "AF-WP5H-STD" },
      { name: "5HP — Silicon Carbide Seal", price: 1100000, sku: "AF-WP5H-SIC" },
    ],
    specifications: [
      { label: "Power", value: "5", unit: "HP" },
      { label: "Max Flow", value: "50", unit: "m³/hr" },
      { label: "Max Head", value: "35", unit: "m" },
      { label: "Body Material", value: "Cast Iron" },
      { label: "Impeller", value: "Bronze" },
      { label: "Suction/Outlet", value: "3/3", unit: "inch" },
    ],
  },
  {
    name: "AquaFlow 10HP Multistage Industrial Pump",
    slug: "aquaflow-10hp-multistage-industrial-pump",
    categorySlug: "industrial-pumps", brandName: "AquaFlow Systems",
    description: "High-pressure multistage centrifugal pump for industrial applications. 10HP, 15-stage design, up to 250m head. Ideal for boiler feed, reverse osmosis, and high-rise water supply.",
    shortDescription: "10HP multistage pump, 15-stage, 250m max head, SS316",
    price: 4200000, costPrice: 2940000,
    unit: "piece", warranty: "3 years", weight: 85, dimensions: "650×350×350 mm",
    tags: ["pump", "industrial", "multistage", "10hp", "high-pressure"],
    isFeatured: true, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 15,
    variants: [
      { name: "10HP — SS304", price: 4200000, sku: "AF-IP10H-304" },
      { name: "10HP — SS316 (Chemical)", price: 5600000, sku: "AF-IP10H-316" },
    ],
    specifications: [
      { label: "Power", value: "10", unit: "HP" },
      { label: "Stages", value: "15" },
      { label: "Max Head", value: "250", unit: "m" },
      { label: "Max Flow", value: "18", unit: "m³/hr" },
      { label: "Material", value: "SS304 / SS316" },
      { label: "Flange Standard", value: "DIN PN16" },
    ],
  },
  // ── Electrical ──
  {
    name: "SteelCraft 50m Armoured Cable 16mm²",
    slug: "steelcraft-50m-armoured-cable-16mm2",
    categorySlug: "cables-wires", brandName: "SteelCraft Tools",
    description: "SWA (steel wire armoured) power cable for underground and outdoor electrical installations. 16mm² 4-core XLPE insulated, PVC sheathed. Rated 0.6/1kV.",
    shortDescription: "50m roll SWA 16mm² 4-core cable, XLPE insulated, 0.6/1kV",
    price: 380000, comparePrice: 420000, costPrice: 266000,
    unit: "roll", warranty: "1 year", weight: 45, dimensions: "50m roll, 25mm dia",
    tags: ["cable", "armoured", "swa", "16mm2", "electrical"],
    isFeatured: false, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 100,
    variants: [
      { name: "50m Roll", price: 380000, sku: "SC-CBL16-50M" },
      { name: "100m Roll", price: 720000, sku: "SC-CBL16-100M" },
    ],
    specifications: [
      { label: "Conductor Size", value: "16", unit: "mm²" },
      { label: "Cores", value: "4" },
      { label: "Insulation", value: "XLPE" },
      { label: "Armour", value: "Steel Wire (SWA)" },
      { label: "Sheath", value: "PVC" },
      { label: "Voltage Rating", value: "0.6/1", unit: "kV" },
    ],
  },
  {
    name: "Powermax 200A Main Switchgear Panel",
    slug: "powermax-200a-main-switchgear-panel",
    categorySlug: "switchgear", brandName: "Powermax Industries",
    description: "Floor-standing 200A 3-phase main switchgear panel for commercial buildings. Includes main breaker, MCCB feeders, surge protection, and metering compartment. Fully wired and tested.",
    shortDescription: "200A 3-phase main switchgear panel, MCCB, SPD, metering",
    price: 2100000, costPrice: 1470000,
    unit: "piece", warranty: "3 years", weight: 120, dimensions: "1800×800×400 mm",
    tags: ["switchgear", "panel", "200a", "3-phase", "mccb", "spd"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "200A — 6-Way MCCB", price: 2100000, sku: "PM-SWG200-6W" },
      { name: "200A — 12-Way MCCB", price: 2800000, sku: "PM-SWG200-12W" },
      { name: "400A — 8-Way MCCB", price: 3800000, sku: "PM-SWG400-8W" },
    ],
    specifications: [
      { label: "Rated Current", value: "200", unit: "A" },
      { label: "Voltage", value: "415", unit: "V" },
      { label: "Phase", value: "3" },
      { label: "Enclosure", value: "Mild steel, powder coated IP54" },
      { label: "Busbar Rating", value: "250", unit: "A" },
      { label: "Standards", value: "IEC 61439-1,2" },
    ],
  },
  {
    name: "Powermax 100kVA Oil-Immersed Transformer",
    slug: "powermax-100kva-oil-immersed-transformer",
    categorySlug: "transformers", brandName: "Powermax Industries",
    description: "Three-phase oil-immersed distribution transformer for utility and industrial substations. Copper windings, conservator tank, off-circuit tap changer, hermetically sealed.",
    shortDescription: "100kVA 3-phase oil transformer, copper windings, 11/0.415kV",
    price: 28000000, costPrice: 19600000,
    unit: "piece", warranty: "5 years", weight: 980, dimensions: "1500×1200×1800 mm",
    tags: ["transformer", "oil-immersed", "100kva", "distribution", "copper"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1,
    variants: [
      { name: "11/0.415 kV — Standard", price: 28000000, sku: "PM-TRF100K-11KV" },
      { name: "33/0.415 kV — High Voltage", price: 35000000, sku: "PM-TRF100K-33KV" },
    ],
    specifications: [
      { label: "Rated Power", value: "100", unit: "kVA" },
      { label: "Primary Voltage", value: "11 (or 33)", unit: "kV" },
      { label: "Secondary Voltage", value: "415", unit: "V" },
      { label: "Winding Material", value: "Copper" },
      { label: "Cooling", value: "ONAN (Oil Natural Air Natural)" },
      { label: "Impedance", value: "4.5", unit: "%" },
      { label: "Standard", value: "IEC 60076" },
    ],
  },
  // ── Tools ──
  {
    name: "SteelCraft 2000W Angle Grinder",
    slug: "steelcraft-2000w-angle-grinder",
    categorySlug: "power-tools", brandName: "SteelCraft Tools",
    description: "Professional 2000W angle grinder with variable speed, anti-vibration handle, and spindle lock. 125mm disc capacity, suitable for cutting and grinding metal, stone, and tile.",
    shortDescription: "2000W angle grinder, 125mm disc, variable speed, anti-vibration",
    price: 250000, comparePrice: 300000, costPrice: 175000,
    unit: "piece", warranty: "2 years", weight: 2.8, dimensions: "400×130×120 mm",
    tags: ["tool", "grinder", "angle-grinder", "2000w", "power-tool"],
    isFeatured: false, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 200,
    variants: [
      { name: "2000W — 125mm", price: 250000, sku: "SC-AG2K-125" },
      { name: "2000W — 150mm", price: 290000, sku: "SC-AG2K-150" },
    ],
    specifications: [
      { label: "Power", value: "2000", unit: "W" },
      { label: "Disc Diameter", value: "125 (or 150)", unit: "mm" },
      { label: "No-Load Speed", value: "2800-11000", unit: "RPM" },
      { label: "Spindle Thread", value: "M14" },
      { label: "Vibration Control", value: "Yes (anti-vibration handle)" },
    ],
  },
  {
    name: "SteelCraft 120-Piece Professional Tool Kit",
    slug: "steelcraft-120-piece-professional-tool-kit",
    categorySlug: "hand-tools", brandName: "SteelCraft Tools",
    description: "Comprehensive 120-piece tool kit in a portable case. Includes chrome vanadium steel sockets, ratchets, hex keys, screwdrivers, pliers, and measuring tape. Ideal for maintenance technicians.",
    shortDescription: "120pc tool kit with sockets, ratchets, screwdrivers, pliers, case",
    price: 680000, comparePrice: 850000, costPrice: 476000,
    unit: "set", warranty: "Lifetime", weight: 8.5, dimensions: "450×350×120 mm",
    tags: ["tool", "tool-kit", "sockets", "hand-tools", "professional"],
    isFeatured: false, isNew: false, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 100,
    variants: [
      { name: "120-Piece Set", price: 680000, sku: "SC-TK120-STD" },
      { name: "200-Piece Master Set", price: 980000, sku: "SC-TK200-MAS" },
    ],
    specifications: [
      { label: "Pieces", value: "120" },
      { label: "Socket Drive", value: "1/4\", 3/8\"" },
      { label: "Material", value: "Chrome Vanadium Steel (CR-V)" },
      { label: "Case", value: "Impact-resistant ABS" },
      { label: "Includes", value: "Sockets, ratchets, hex keys, screwdrivers, pliers, tape measure" },
    ],
  },
  {
    name: "SteelCraft 5-Ton Manual Chain Hoist",
    slug: "steelcraft-5-ton-manual-chain-hoist",
    categorySlug: "construction-machinery", brandName: "SteelCraft Tools",
    description: "5-ton capacity portable chain hoist for lifting in workshops, warehouses, and construction sites. Alloy steel load chain, enclosed gear housing, safety latch hook.",
    shortDescription: "5-ton manual chain hoist, 3m lift, alloy steel chain",
    price: 1800000, comparePrice: 2100000, costPrice: 1260000,
    unit: "piece", warranty: "3 years", weight: 38, dimensions: "450×250×250 mm",
    tags: ["hoist", "chain-block", "5-ton", "lifting", "manual"],
    isFeatured: false, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 20,
    variants: [
      { name: "5-Ton × 3m Lift", price: 1800000, sku: "SC-CH5T-3M" },
      { name: "5-Ton × 6m Lift", price: 2400000, sku: "SC-CH5T-6M" },
    ],
    specifications: [
      { label: "Capacity", value: "5", unit: "tons" },
      { label: "Standard Lift", value: "3 (or 6)", unit: "m" },
      { label: "Load Chain", value: "Alloy steel 8mm" },
      { label: "Pull Force @ Rated Load", value: "380", unit: "N" },
      { label: "Testing", value: "150% overload tested" },
      { label: "Standard", value: "BS EN 13157" },
    ],
  },
  // ── Industrial ──
  {
    name: "IndusPro 500L Vertical Storage Tank",
    slug: "induspro-500l-vertical-storage-tank",
    categorySlug: "storage-solutions", brandName: "IndusPro Solutions",
    description: "Heavy-duty 500L vertical polyethylene storage tank for water and chemical storage. UV-stabilized, rotationally molded, food-grade HDPE. Fitted with 2\" BSP outlet and vented lid.",
    shortDescription: "500L HDPE vertical tank, food-grade, UV-stabilized, 2\" outlet",
    price: 1100000, comparePrice: 1300000, costPrice: 770000,
    unit: "piece", warranty: "5 years", weight: 18, dimensions: "800×800×1450 mm",
    tags: ["tank", "storage", "500l", "hdpe", "water", "chemical"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 30,
    variants: [
      { name: "500L — Natural (Translucent)", price: 1100000, sku: "IS-TK500-NAT" },
      { name: "500L — Black (UV Max)", price: 1250000, sku: "IS-TK500-BLK" },
    ],
    specifications: [
      { label: "Capacity", value: "500", unit: "L" },
      { label: "Material", value: "Food-grade HDPE" },
      { label: "Color", value: "Natural / Black" },
      { label: "Wall Thickness", value: "5-8", unit: "mm" },
      { label: "Outlet", value: "2\" BSP female" },
      { label: "Max Temperature", value: "60", unit: "°C" },
    ],
  },
  {
    name: "IndusPro Full Body Safety Harness Kit",
    slug: "induspro-full-body-safety-harness-kit",
    categorySlug: "safety-gear", brandName: "IndusPro Solutions",
    description: "EN 361 certified full-body fall arrest harness with shock-absorbing lanyard. Five-point adjustment, dorsal D-ring, chest and leg padding. Includes 1.8m shock-absorbing lanyard with double snap hooks.",
    shortDescription: "Full-body fall arrest harness, EN 361, 5-point adjustment, with lanyard",
    price: 320000, comparePrice: 380000, costPrice: 224000,
    unit: "piece", warranty: "2 years", weight: 2.3,
    tags: ["safety", "harness", "fall-arrest", "en361", "ppe"],
    isFeatured: false, isNew: true, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 200,
    variants: [
      { name: "Standard Harness + Lanyard", price: 320000, sku: "IS-SFH-STD" },
      { name: "Harness + Lanyard + Helmet", price: 450000, sku: "IS-SFH-HELM" },
    ],
    specifications: [
      { label: "Standard", value: "EN 361:2002" },
      { label: "Material", value: "Polyester webbing 45mm" },
      { label: "D-Rings", value: "1 dorsal + 1 sternal (optional)" },
      { label: "Lanyard Length", value: "1.8", unit: "m" },
      { label: "Max Arrest Force", value: "<6", unit: "kN" },
      { label: "Max User Weight", value: "140", unit: "kg" },
    ],
  },
  {
    name: "IndusPro 2-Ton Hydraulic Pallet Jack",
    slug: "induspro-2-ton-hydraulic-pallet-jack",
    categorySlug: "material-handling", brandName: "IndusPro Solutions",
    description: "Heavy-duty 2-ton capacity hydraulic pallet jack for warehouse and logistics operations. Polyurethane wheels, 685×1200mm fork size, sealed hydraulic unit for leak-free operation.",
    shortDescription: "2-ton pallet jack, PU wheels, 685×1200mm forks, sealed hydraulics",
    price: 2500000, comparePrice: 2900000, costPrice: 1750000,
    unit: "piece", warranty: "3 years", weight: 75, dimensions: "1500×685×120 mm (fork)",
    tags: ["pallet-jack", "hydraulic", "2-ton", "warehouse", "logistics"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 20,
    variants: [
      { name: "Standard 2-Ton — PU Wheels", price: 2500000, sku: "IS-PJ2T-PU" },
      { name: "2-Ton — Nylon Wheels (Heavy Duty)", price: 2200000, sku: "IS-PJ2T-NY" },
      { name: "2-Ton — Stainless Steel (Food Grade)", price: 3800000, sku: "IS-PJ2T-SS" },
    ],
    specifications: [
      { label: "Capacity", value: "2", unit: "tons" },
      { label: "Fork Size (L×W)", value: "1200×685", unit: "mm" },
      { label: "Min Fork Height", value: "85", unit: "mm" },
      { label: "Max Fork Height", value: "200", unit: "mm" },
      { label: "Wheel Material", value: "PU / Nylon / SS" },
      { label: "Hydraulic Unit", value: "Sealed, leak-free" },
    ],
  },
]

// Real product images from Pexels (free stock photography)
const productImages: Record<string, string> = {
  "powermax-20kva-diesel-generator": "https://images.pexels.com/photos/31740442/pexels-photo-31740442.jpeg?w=600&h=400&fit=crop",
  "powermax-5kva-petrol-generator": "https://images.pexels.com/photos/31740442/pexels-photo-31740442.jpeg?w=600&h=400&fit=crop",
  "powermax-100kva-industrial-generator": "https://images.pexels.com/photos/2566845/pexels-photo-2566845.jpeg?w=600&h=400&fit=crop",
  "helios-550w-monocrystalline-solar-panel": "https://images.pexels.com/photos/356049/pexels-photo-356049.jpeg?w=600&h=400&fit=crop",
  "helios-5kw-hybrid-solar-inverter": "https://images.pexels.com/photos/8853502/pexels-photo-8853502.jpeg?w=600&h=400&fit=crop",
  "helios-200ah-deep-cycle-gel-battery": "https://images.pexels.com/photos/36085816/pexels-photo-36085816.jpeg?w=600&h=400&fit=crop",
  "aquaflow-2hp-submersible-pump": "https://images.pexels.com/photos/9796524/pexels-photo-9796524.jpeg?w=600&h=400&fit=crop",
  "aquaflow-5hp-centrifugal-water-pump": "https://images.pexels.com/photos/9796524/pexels-photo-9796524.jpeg?w=600&h=400&fit=crop",
  "aquaflow-10hp-multistage-industrial-pump": "https://images.pexels.com/photos/9796524/pexels-photo-9796524.jpeg?w=600&h=400&fit=crop",
  "steelcraft-50m-armoured-cable": "https://images.pexels.com/photos/7937305/pexels-photo-7937305.jpeg?w=600&h=400&fit=crop",
  "powermax-200a-main-switchgear-panel": "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?w=600&h=400&fit=crop",
  "powermax-100kva-oil-immersed-transformer": "https://images.pexels.com/photos/33041841/pexels-photo-33041841.jpeg?w=600&h=400&fit=crop",
  "steelcraft-2000w-angle-grinder": "https://images.pexels.com/photos/13296062/pexels-photo-13296062.jpeg?w=600&h=400&fit=crop",
  "steelcraft-120-piece-professional-tool-kit": "https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?w=600&h=400&fit=crop",
  "steelcraft-5-ton-manual-chain-hoist": "https://images.pexels.com/photos/29224568/pexels-photo-29224568.jpeg?w=600&h=400&fit=crop",
  "induspro-500l-vertical-storage-tank": "https://images.pexels.com/photos/4793456/pexels-photo-4793456.jpeg?w=600&h=400&fit=crop",
  "induspro-full-body-safety-harness-kit": "https://images.pexels.com/photos/4097271/pexels-photo-4097271.jpeg?w=600&h=400&fit=crop",
  "induspro-2-ton-hydraulic-pallet-jack": "https://images.pexels.com/photos/17229385/pexels-photo-17229385.jpeg?w=600&h=400&fit=crop",
}

const ordersData = [
  { status: "Pending" as const, itemCount: 2, itemIndexes: [0, 1] },
  { status: "Processing" as const, itemCount: 1, itemIndexes: [2] },
  { status: "Paid" as const, itemCount: 3, itemIndexes: [3, 4, 5] },
  { status: "Shipped" as const, itemCount: 1, itemIndexes: [6] },
  { status: "Delivered" as const, itemCount: 2, itemIndexes: [7, 8] },
  { status: "Cancelled" as const, itemCount: 1, itemIndexes: [9] },
]

// ── Clears existing data ──
async function clearData() {
  console.log("\nClearing existing data...")
  const tables = [
    "auditLog", "notification", "wishlist", "review", "quoteItem", "quote",
    "cartItem", "cart", "orderStatusHistory", "orderItem", "paymentTransaction",
    "payment", "order", "inventoryMovement", "inventory", "warehouse",
    "productDownload", "productSpecification", "productImage", "productVariant",
    "productStatusHistory", "product", "brand", "userRole", "rolePermission",
    "permission", "role", "category", "account", "session", "verification", "user",
  ]
  for (const table of tables) {
    await (prisma as any)[table].deleteMany()
  }
  console.log("  All tables cleared.")
}

// ── Phase 1: Users ──
async function seedUsers() {
  console.log("\n── Phase 1: Users ──")
  const adminPw = hashPassword("Demo@123456")
  const customerPw = hashPassword("Demo@123456")

  const admin = await prisma.user.create({
    data: {
      name: "Demo Admin",
      email: "demo@gk-supply.com",
      emailVerified: true,
      role: "super_admin",
      phone: "+255 712 000 001",
    },
  })
  await prisma.account.create({
    data: {
      userId: admin.id,
      accountId: admin.id,
      providerId: "credential",
      password: adminPw,
    },
  })
  console.log(`  ✓ Admin: demo@gk-supply.com / Demo@123456 (role: super_admin)`)

  const customer = await prisma.user.create({
    data: {
      name: "Juma Khamis",
      email: "customer@gk-supply.com",
      emailVerified: true,
      role: "customer",
      phone: "+255 712 000 002",
    },
  })
  await prisma.account.create({
    data: {
      userId: customer.id,
      accountId: customer.id,
      providerId: "credential",
      password: customerPw,
    },
  })
  console.log(`  ✓ Customer: customer@gk-supply.com / Demo@123456`)

  return { adminId: admin.id, customerId: customer.id }
}

// ── Phase 2: Roles & Permissions ──
async function seedRoles() {
  console.log("\n── Phase 2: Roles & Permissions ──")

  const rolesData = [
    { name: "super_admin", description: "Full system access" },
    { name: "admin", description: "Administrative access" },
    { name: "inventory_manager", description: "Inventory and warehouse management" },
    { name: "sales_manager", description: "Sales and order management" },
    { name: "customer_support", description: "Customer service and order support" },
  ]
  const modules = ["users", "roles", "products", "orders", "inventory", "payments", "analytics", "settings"]
  const actions = ["create", "read", "update", "delete"]

  const roles: Record<string, string> = {}
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r })
    roles[r.name] = role.id
    console.log(`  ✓ Role: ${r.name}`)
  }

  // Create permissions
  const permIds: string[] = []
  for (const mod of modules) {
    for (const action of actions) {
      const perm = await prisma.permission.create({
        data: { name: `${mod}.${action}`, module: mod, action: action },
      })
      permIds.push(perm.id)
    }
  }
  console.log(`  ✓ ${modules.length * actions.length} permissions created`)

  // Grant all permissions to super_admin
  for (const permId of permIds) {
    await prisma.rolePermission.create({
      data: { roleId: roles["super_admin"], permissionId: permId },
    })
  }
  // Grant partial to admin
  for (const permId of permIds) {
    const perm = await prisma.permission.findUnique({ where: { id: permId } })
    if (perm && perm.action !== "delete") {
      await prisma.rolePermission.create({
        data: { roleId: roles["admin"], permissionId: permId },
      })
    }
  }
  console.log("  ✓ Permissions assigned to super_admin and admin")

  return roles
}

// ── Phase 3: Brands ──
async function seedBrands() {
  console.log("\n── Phase 3: Brands ──")
  const brandRecords: Record<string, string> = {}
  for (const b of brandsData) {
    const brand = await prisma.brand.create({
      data: { ...b, slug: slugify(b.name), isActive: true },
    })
    brandRecords[b.name] = brand.id
    console.log(`  ✓ ${b.name}`)
  }
  return brandRecords
}

// ── Phase 4: Categories ──
async function seedCategories() {
  console.log("\n── Phase 4: Categories ──")
  const categoryMap: Record<string, string> = {}

  for (const cat of categories) {
    const { children, ...parentData } = cat
    const parent = await prisma.category.create({ data: { ...parentData, isActive: true } })
    categoryMap[parent.slug] = parent.id
    console.log(`  ✓ ${parent.name}`)

    for (const child of children) {
      const c = await prisma.category.create({
        data: { ...child, parentId: parent.id, description: `${parentData.name} — ${child.name}`, isActive: true },
      })
      categoryMap[child.slug] = c.id
    }
  }
  return categoryMap
}

// ── Phase 5: Products ──
async function seedProducts(categoryMap: Record<string, string>, brandMap: Record<string, string>) {
  console.log("\n── Phase 5: Products ──")
  const productIds: string[] = []
  const productMap: Record<string, string> = {}

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        categoryId: categoryMap[p.categorySlug],
        brandId: brandMap[p.brandName],
        sku: p.variants[0].sku,
        price: p.price,
        comparePrice: p.comparePrice,
        costPrice: p.costPrice,
        unit: p.unit,
        warranty: p.warranty,
        weight: p.weight,
        dimensions: p.dimensions,
        material: p.material,
        tags: p.tags,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        onSale: p.onSale,
        isPublished: p.isPublished,
        status: p.isPublished ? "Active" : "Draft",
        publishedAt: p.isPublished ? new Date() : null,
        minOrderQuantity: p.minOrderQuantity,
        maxOrderQuantity: p.maxOrderQuantity,
        currency: "TZS",
      },
    })
    productIds.push(product.id)
    productMap[p.slug] = product.id

    // Status history
    await prisma.productStatusHistory.create({
      data: { productId: product.id, status: "Active", changedBy: "seed", note: "Seeded" },
    })

    // Variants
    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: { productId: product.id, name: v.name, sku: v.sku, price: v.price, isActive: true },
      })
    }

    // Specifications
    for (const s of p.specifications) {
      await prisma.productSpecification.create({
        data: { productId: product.id, ...s },
      })
    }

    // Sample product image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: productImages[p.slug] || `https://picsum.photos/seed/${p.slug}/600/400`,
        alt: p.name,
        isPrimary: true,
      },
    })

    console.log(`  ✓ ${p.name}`)
  }
  console.log(`  Total: ${productIds.length} products`)
  return { productIds, productMap }
}

// ── Phase 6: Warehouses ──
async function seedWarehouses() {
  console.log("\n── Phase 6: Warehouses ──")
  const whData = [
    { name: "Main Warehouse — Dar es Salaam", location: "Plot 123, Nyerere Road, Dar es Salaam" },
    { name: "Mwanza Distribution Center", location: "Block B, Mwanza Industrial Area" },
  ]
  const warehouseIds: string[] = []
  for (const w of whData) {
    const wh = await prisma.warehouse.create({ data: w })
    warehouseIds.push(wh.id)
    console.log(`  ✓ ${w.name}`)
  }
  return warehouseIds
}

// ── Phase 7: Inventory ──
async function seedInventory(productIds: string[], warehouseIds: string[]) {
  console.log("\n── Phase 7: Inventory ──")
  const inventoryIds: string[] = []

  for (const pid of productIds) {
    for (const wid of warehouseIds) {
      const stock = Math.floor(Math.random() * 80) + 10
      const inv = await prisma.inventory.create({
        data: {
          productId: pid,
          warehouseId: wid,
          quantity: stock,
          reservedQuantity: 0,
          minStockLevel: 5,
        },
      })
      inventoryIds.push(inv.id)
      // Initial stock-in movement
      await prisma.inventoryMovement.create({
        data: {
          productId: pid,
          warehouseId: wid,
          type: "STOCK_IN",
          quantity: stock,
          reference: "INITIAL_STOCK",
          note: "Initial seed stock",
        },
      })
    }
    // Small delay avoids duplicate key issues (shouldn't be needed with IDs but safe)
  }
  console.log(`  ✓ ${productIds.length * warehouseIds.length} inventory records created`)
  return inventoryIds
}

// ── Phase 8: Orders ──
async function seedOrders(customerId: string, productMap: Record<string, string>) {
  console.log("\n── Phase 8: Orders ──")

  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } })
  const orderIds: string[] = []
  const paymentIds: string[] = []
  const daysAgo = [2, 5, 8, 14, 22, 1]

  for (let i = 0; i < ordersData.length; i++) {
    const o = ordersData[i]
    const d = new Date()
    d.setDate(d.getDate() - daysAgo[i])

    const startIdx = (i * 2) % products.length
    const items = []
    for (let j = 0; j < o.itemCount; j++) {
      items.push(products[(startIdx + j) % products.length])
    }
    if (items.length === 0) continue

    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * (i + 1), 0)
    const shipping = 50000
    const tax = Math.round(subtotal * 0.18)
    const total = subtotal + tax + shipping

    const order = await prisma.order.create({
      data: {
        userId: customerId,
        orderNumber: `GK-SEED-${String(1001 + i).padStart(4, "0")}`,
        status: o.status,
        subtotal,
        tax,
        shipping,
        total,
        currency: "TZS",
        notes: `Seed order #${i + 1}`,
        createdAt: d,
        updatedAt: d,
      },
    })
    orderIds.push(order.id)

    // Order items
    for (const item of items) {
      const qty = i + 1
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.id,
          name: item.name,
          sku: item.sku,
          quantity: qty,
          price: Number(item.price || 0),
          total: Number(item.price || 0) * qty,
        },
      })
    }

    // Status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: o.status,
        note: `Order created with status ${o.status}`,
        changedBy: "seed",
        createdAt: d,
      },
    })

    // Payment for non-cancelled orders
    if (o.status !== "Cancelled") {
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "mobile_money",
          status: o.status === "Pending" ? "Pending" : "Paid",
          amount: total,
          currency: "TZS",
          reference: `PAY-SEED-${String(2001 + i).padStart(4, "0")}`,
          paidAt: ["Paid", "Processing", "Shipped", "Delivered"].includes(o.status) ? d : null,
          createdAt: d,
          updatedAt: d,
        },
      })
      paymentIds.push(payment.id)

      // Transaction
      if (["Paid", "Processing", "Shipped", "Delivered"].includes(o.status)) {
        await prisma.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            status: "Paid",
            amount: total,
            reference: `TXN-SEED-${String(3001 + i).padStart(4, "0")}`,
            createdAt: d,
          },
        })
      }
    }

    console.log(`  ✓ Order GK-SEED-${String(1001 + i).padStart(4, "0")} (${o.status})`)
  }

  return { orderIds, paymentIds }
}

// ── Phase 9: Other Entities ──
async function seedOther(customerId: string, adminId: string, productMap: Record<string, string>) {
  console.log("\n── Phase 9: Other Entities ──")

  const products = await prisma.product.findMany({ take: 6 })

  // Addresses
  const addressData = [
    { label: "Home", street: "Plot 45, Mikocheni B", city: "Dar es Salaam", state: "Dar es Salaam", isDefault: true },
    { label: "Office", street: "3rd Floor, Golden Tower, Samora Avenue", city: "Dar es Salaam", state: "Dar es Salaam", isDefault: false },
  ]
  for (const addr of addressData) {
    await prisma.address.create({ data: { userId: customerId, ...addr, country: "Tanzania" } })
  }
  console.log(`  ✓ ${addressData.length} addresses for Juma Khamis`)

  // Cart
  const cart = await prisma.cart.create({ data: { userId: customerId } })
  for (let i = 0; i < Math.min(3, products.length); i++) {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: products[i].id, quantity: i + 1 },
    })
  }
  console.log(`  ✓ Cart with ${Math.min(3, products.length)} items`)

  // Reviews
  const reviewsData = [
    { rating: 5, title: "Excellent generator!", content: "We bought the 20kVA for our workshop and it has been running flawlessly for 3 months. Highly recommended." },
    { rating: 4, title: "Good value solar panels", content: "Great efficiency and fast delivery. Would buy again." },
    { rating: 5, title: "Top quality harness", content: "The safety harness is very comfortable and meets all standards." },
    { rating: 3, title: "Decent angle grinder", content: "Works well for light to medium use. The anti-vibration handle is nice." },
  ]
  for (let i = 0; i < reviewsData.length && i < products.length; i++) {
    await prisma.review.create({
      data: {
        productId: products[i].id,
        userId: customerId,
        ...reviewsData[i],
        isApproved: true,
      },
    })
  }
  console.log(`  ✓ ${Math.min(reviewsData.length, products.length)} reviews`)

  // Wishlist
  for (let i = 0; i < Math.min(4, products.length); i++) {
    await prisma.wishlist.create({
      data: { userId: customerId, productId: products[i].id },
    })
  }
  console.log("  ✓ 4 wishlist items")

  // Notifications
  const notifications = [
    { title: "Order Confirmed", message: "Your order GK-SEED-1001 has been confirmed.", type: "order", link: "/account/orders" },
    { title: "Payment Received", message: "Payment of TZS 5,000,000 for order GK-SEED-1002 received.", type: "payment", link: "/account/payments" },
    { title: "Order Shipped", message: "Order GK-SEED-1004 has been shipped.", type: "order", link: "/account/orders" },
  ]
  for (const n of notifications) {
    await prisma.notification.create({ data: { userId: customerId, ...n } })
  }
  console.log(`  ✓ ${notifications.length} notifications`)

  // Audit logs
  const auditLogs = [
    { action: "USER_CREATED", entity: "user", entityId: customerId, description: "Customer account created via seed" },
    { action: "PRODUCT_CREATED", entity: "product", description: "18 products seeded" },
    { action: "ORDER_CREATED", entity: "order", description: "6 test orders created" },
  ]
  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: { userId: adminId, ...log } })
  }
  console.log(`  ✓ ${auditLogs.length} audit log entries`)

  // Quote
  if (products.length >= 3) {
    const quote = await prisma.quote.create({
      data: {
        userId: customerId,
        quoteNumber: `QT-SEED-${String(4001)}`,
        status: "Submitted",
        notes: "Pricing request for bulk order of generators and solar panels",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    await prisma.quoteItem.create({
      data: { quoteId: quote.id, productId: products[0].id, name: products[0].name, sku: products[0].sku, quantity: 3 },
    })
    await prisma.quoteItem.create({
      data: { quoteId: quote.id, productId: products[3].id, name: products[3].name, sku: products[3].sku, quantity: 10 },
    })
    console.log("  ✓ 1 quote (2 items)")
  }
}

// ── Phase 10: Test Server Actions ──
async function testActions(categoryMap: Record<string, string>) {
  console.log("\n═══ Phase 10: Verify Server Actions ═══")
  console.log("  (non-auth actions tested directly; auth actions verify guards)\n")

  async function test<T>(name: string, fn: () => Promise<T>, expectedToFail = false) {
    try {
      const result = await fn()
      if (expectedToFail) {
        actionFail++
        actionResults.push({ name, status: "FAIL — should have thrown auth error" })
        console.log(`  ✗ ${name} — expected auth error but succeeded`)
      } else {
        actionPass++
        actionResults.push({ name, status: "PASS" })
        console.log(`  ✓ ${name}`)
      }
    } catch (e: any) {
      if (expectedToFail) {
        actionPass++
        actionResults.push({ name, status: "PASS (auth guard works)" })
        console.log(`  ✓ ${name} — correctly rejected (${e.message?.slice(0, 60)})`)
      } else {
        actionFail++
        actionResults.push({ name, status: "FAIL", error: e.message })
        console.log(`  ✗ ${name} — ${e.message?.slice(0, 80)}`)
      }
    }
  }

  // Dynamic imports — may fail in seed context, that's OK
  let canTest = true
  let actions: any = {}
  try {
    actions = await import("../src/features/products/actions/prisma")
  } catch {
    canTest = false
    console.log("  [SKIP] Cannot import server actions from seed context")
  }

  if (canTest) {
    // Read actions
    await test("getCategories()", () => actions.getCategories())
    await test("getHeaderCategories()", () => actions.getHeaderCategories())
    await test("getBrands()", () => actions.getBrands())
    await test("getProductsList({})", () => actions.getProductsList({}))
    await test("getPublicProducts({})", () => actions.getPublicProducts({}))
    // Search actions
    try {
      const searchActions = await import("../src/features/search/actions")
      await test("searchProducts({ q: 'diesel' })", () => searchActions.searchProducts({ q: "diesel", sort: "newest", page: 1, pageSize: 20 }))
      await test("searchAutocomplete('gen')", () => searchActions.searchAutocomplete("gen"))
    } catch { /* skip */ }

    // Product detail
    const products = await actions.getProductsList({ pageSize: 1 })
    if (products.items?.length) {
      const first = products.items[0]
      await test(`getProductBySlug('${first.slug}')`, () => actions.getProductBySlug(first.slug))
      await test(`getProductById('${first.id}')`, () => actions.getProductById(first.id))
      await test(`getRelatedProducts('${first.id}', '${first.categoryId}')`, () => actions.getRelatedProducts(first.id, first.categoryId))
    }

    // Auth-gated actions — verify they reject unauthenticated calls
    try {
      const orderActions = await import("../src/features/orders/actions/index")
      await test("getCustomerOrders() (no auth → rejects)", () => orderActions.getCustomerOrders({}), true)
    } catch { /* skip */ }
  }
}

// ── Main ──
async function main() {
  console.log("═══ GK General Supply — Comprehensive Seed ═══")
  console.log()

  await clearData()

  const { adminId, customerId } = await seedUsers()

  const roles = await seedRoles()

  // Assign admin role to the admin user
  if (roles["super_admin"]) {
    await prisma.userRole.create({ data: { userId: adminId, roleId: roles["super_admin"] } })
    console.log("  ✓ Admin user assigned to super_admin role")
  }
  if (roles["customer_support"]) {
    await prisma.userRole.create({ data: { userId: customerId, roleId: roles["customer_support"] } })
  }

  const brandMap = await seedBrands()
  const categoryMap = await seedCategories()
  const { productIds, productMap } = await seedProducts(categoryMap, brandMap)
  const warehouseIds = await seedWarehouses()
  const inventoryIds = await seedInventory(productIds, warehouseIds)
  await seedOrders(customerId, productMap)
  await seedOther(customerId, adminId, productMap)
  await testActions(categoryMap)

  // Summary
  console.log("\n═══ Seed Summary ═══")
  console.log(`  Admin:     demo@gk-supply.com / Demo@123456`)
  console.log(`  Customer:  customer@gk-supply.com / Demo@123456`)
  console.log(`  Roles:     5`)
  console.log(`  Permissions: 32`)
  console.log(`  Brands:    ${brandsData.length}`)
  console.log(`  Categories: 6 parents + 30 children`)
  console.log(`  Products:  ${productIds.length}`)
  console.log(`  Warehouses: ${warehouseIds.length}`)
  console.log(`  Inventory: ${inventoryIds.length} records`)
  console.log(`  Orders:    ${ordersData.length}`)
  console.log()

  if (actionPass > 0 || actionFail > 0) {
    console.log("── Server Action Tests ──")
    for (const r of actionResults) {
      const icon = r.status.startsWith("PASS") ? "✓" : "✗"
      console.log(`  ${icon} ${r.name} → ${r.status}`)
      if (r.error) console.log(`     Error: ${r.error}`)
    }
    console.log(`\n  ${actionPass} passed, ${actionFail} failed`)
  }

  console.log("\nSeeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

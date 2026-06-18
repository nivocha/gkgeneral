import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomBytes, scryptSync } from "node:crypto"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const key = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 })
  return `${salt}:${key.toString("hex")}`
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
}

let actionPass = 0
let actionFail = 0
const actionResults: { name: string; status: string; error?: string }[] = []

function logAction(name: string, fn: () => Promise<unknown>) {}

const brandsData = [
  { name: "Cummins Inc.", description: "American Fortune 500 corporation designing and manufacturing power generation equipment" },
  { name: "Generac", description: "American manufacturer of backup power generation products and portable generators" },
  { name: "Honda", description: "Japanese multinational known for reliable engines and portable generator technology" },
  { name: "Yuchai", description: "Chinese manufacturer of diesel engines and generator sets for industrial applications" },
  { name: "Ricardo", description: "UK-based engineering company known for Ricardo diesel engines in generator applications" },
  { name: "Bluetti", description: "Innovative brand specializing in portable power stations and solar energy solutions" },
  { name: "EcoFlow", description: "Leading brand in portable power stations and renewable energy storage technology" },
  { name: "Jackery", description: "Pioneer in portable solar generators and outdoor power solutions" },
  { name: "Predator", description: "Value-focused brand offering reliable inverter generators and power equipment" },
]

const categories = [
  {
    name: "Generators", slug: "generators", description: "Diesel, portable, and inverter generators for commercial and residential use", icon: "Zap", sortOrder: 0,
    children: [
      { name: "Diesel Generators", slug: "diesel-generators", sortOrder: 0 },
      { name: "Portable Generators", slug: "portable-generators", sortOrder: 1 },
      { name: "Inverter Generators", slug: "inverter-generators", sortOrder: 2 },
      { name: "Generator Accessories", slug: "generator-accessories", sortOrder: 3 },
    ],
  },
  {
    name: "Solar Products", slug: "solar", description: "Portable power stations, solar generators, and solar energy solutions", icon: "Sun", sortOrder: 1,
    children: [
      { name: "Portable Power Stations", slug: "portable-power-stations", sortOrder: 0 },
      { name: "Solar Generators", slug: "solar-generators", sortOrder: 1 },
      { name: "Solar Panels", slug: "solar-panels", sortOrder: 2 },
      { name: "Solar Accessories", slug: "solar-accessories", sortOrder: 3 },
    ],
  },
  {
    name: "Pumps", slug: "pumps", description: "Water pumps, submersible pumps and industrial pumping solutions", icon: "Droplets", sortOrder: 2,
    children: [
      { name: "Water Pumps", slug: "water-pumps", sortOrder: 0 },
      { name: "Submersible Pumps", slug: "submersible-pumps", sortOrder: 1 },
      { name: "Pressure Pumps", slug: "pressure-pumps", sortOrder: 2 },
    ],
  },
  {
    name: "Electrical", slug: "electrical", description: "Cables, switchgear, transformers and electrical equipment", icon: "Cable", sortOrder: 3,
    children: [
      { name: "Cables & Wires", slug: "cables-wires", sortOrder: 0 },
      { name: "Switchgear", slug: "switchgear", sortOrder: 1 },
      { name: "Circuit Breakers", slug: "circuit-breakers", sortOrder: 2 },
    ],
  },
  {
    name: "Tools & Machinery", slug: "tools", description: "Power tools, hand tools and construction machinery", icon: "Wrench", sortOrder: 4,
    children: [
      { name: "Power Tools", slug: "power-tools", sortOrder: 0 },
      { name: "Hand Tools", slug: "hand-tools", sortOrder: 1 },
    ],
  },
  {
    name: "Industrial Solutions", slug: "industrial", description: "Industrial equipment, safety gear and material handling solutions", icon: "Factory", sortOrder: 5,
    children: [
      { name: "Safety Gear", slug: "safety-gear", sortOrder: 0 },
      { name: "Material Handling", slug: "material-handling", sortOrder: 1 },
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
  unit: string
  warranty: string
  weight?: number
  dimensions?: string
  tags: string[]
  isFeatured: boolean
  isNew: boolean
  onSale: boolean
  isPublished: boolean
  minOrderQuantity: number
  maxOrderQuantity?: number
  variants: { name: string; price: number; sku: string }[]
  specifications: { label: string; value: string; unit?: string }[]
  imageFile: string
}

const productsData: ProductSeed[] = [
  {
    name: "15kVA Cummins Electric Diesel Generator",
    slug: "15kva-cummins-electric-diesel-generator",
    categorySlug: "diesel-generators", brandName: "Cummins Inc.",
    description: "Reliable 15kVA Cummins diesel generator set designed for commercial backup and prime power applications. Features a robust Cummins engine with automatic voltage regulation, low oil shutdown protection, and a heavy-duty alternator. Ideal for small businesses, workshops, and residential backup power across Tanzania.",
    shortDescription: "15kVA Cummins diesel genset, reliable prime/standby power, AVR equipped",
    price: 3500,
    unit: "piece", warranty: "2 years", weight: 450, dimensions: "1800×750×1200 mm",
    tags: ["cummins", "diesel", "generator", "15kva", "backup-power"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 20,
    variants: [
      { name: "Standard Open Skid", price: 3500, sku: "CM-DG15K-OSK" },
      { name: "Soundproof Canopy", price: 4200, sku: "CM-DG15K-CNP" },
    ],
    specifications: [
      { label: "Power Rating", value: "15", unit: "kVA" },
      { label: "Engine", value: "Cummins diesel" },
      { label: "Alternator", value: "Self-exciting, AVR" },
      { label: "Voltage", value: "400/230", unit: "V" },
      { label: "Phase", value: "3-phase, 4-wire" },
      { label: "Fuel Consumption @ 75%", value: "3.5", unit: "L/hr" },
      { label: "Fuel Tank", value: "80", unit: "L" },
    ],
    imageFile: "15kVA-Cummins-Electric-Diesel-Generator.jpg",
  },
  {
    name: "15kVA Super Silent Diesel Generator (Ricardo Engine)",
    slug: "15kva-super-silent-diesel-generator-ricardo-engine",
    categorySlug: "diesel-generators", brandName: "Ricardo",
    description: "Super silent 15kVA diesel generator powered by a Ricardo engine, enclosed in a soundproof canopy for noise-sensitive environments. Ideal for hospitals, hotels, offices, and residential areas where low noise operation is critical. Features automatic startup, digital control panel, and low fuel consumption.",
    shortDescription: "15kVA super silent Ricardo diesel genset, soundproof canopy, low noise",
    price: 2800,
    unit: "piece", warranty: "2 years", weight: 380, dimensions: "1600×700×1100 mm",
    tags: ["ricardo", "diesel", "generator", "15kva", "silent", "soundproof"],
    isFeatured: false, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 15,
    variants: [
      { name: "Soundproof Canopy", price: 2800, sku: "RC-DG15K-CNP" },
      { name: "Soundproof + ATS Panel", price: 3500, sku: "RC-DG15K-ATS" },
    ],
    specifications: [
      { label: "Power Rating", value: "15", unit: "kVA" },
      { label: "Engine", value: "Ricardo diesel" },
      { label: "Noise Level @ 7m", value: "65", unit: "dB(A)" },
      { label: "Voltage", value: "400/230", unit: "V" },
      { label: "Fuel Consumption @ 75%", value: "3.2", unit: "L/hr" },
      { label: "Fuel Tank", value: "75", unit: "L" },
      { label: "Runtime @ 75% Load", value: "10", unit: "hrs" },
    ],
    imageFile: "15kVA-Super-Silent-Generator-with-Ricardo-Engine.webp",
  },
  {
    name: "20kVA Silent Diesel Generator Set",
    slug: "20kva-silent-diesel-generator-set",
    categorySlug: "diesel-generators", brandName: "Cummins Inc.",
    description: "Versatile 20kVA silent diesel generator set suitable for home, commercial, and industrial backup power. Equipped with a reliable diesel engine, high-quality alternator, and sound-dampened canopy. Features include AVR for stable output, low oil/fuel shutdown, and easy-to-read control panel. Reliable power solution for the Tanzanian market.",
    shortDescription: "20kVA silent diesel genset, AVR, soundproof canopy, home/industrial use",
    price: 4500,
    unit: "piece", warranty: "2 years", weight: 520, dimensions: "1900×800×1300 mm",
    tags: ["cummins", "yuchai", "diesel", "generator", "20kva", "silent", "soundproof"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "Soundproof Canopy", price: 4500, sku: "CM-DG20K-SCP" },
      { name: "Soundproof + Auto Start", price: 5200, sku: "CM-DG20K-AST" },
      { name: "Open Skid (Budget)", price: 3800, sku: "CM-DG20K-OSK" },
    ],
    specifications: [
      { label: "Power Rating", value: "20", unit: "kVA" },
      { label: "Engine", value: "Diesel, 4-cylinder" },
      { label: "Alternator", value: "Brushless, AVR" },
      { label: "Voltage", value: "400/230", unit: "V" },
      { label: "Phase", value: "3-phase" },
      { label: "Fuel Consumption @ 75%", value: "4.5", unit: "L/hr" },
      { label: "Noise Level", value: "68", unit: "dB(A)" },
    ],
    imageFile: "20kVA-to-2000kw-20kw-100kVA-250kVA-Yuchai-Weichai-Cummins-Smart-Electric-Power-Small-Portable-Silent-Diesel-Generator-Set-Dynamo-Genset-for-Home-Industrial-Sale.jpg",
  },
  {
    name: "Bluetti AC200Max Portable Power Station (2048Wh)",
    slug: "bluetti-ac200max-portable-power-station-2048wh",
    categorySlug: "portable-power-stations", brandName: "Bluetti",
    description: "The Bluetti AC200Max is a high-capacity 2048Wh LiFePO4 portable power station with 2200W pure sine wave AC output (4800W peak). Features multiple charging options including solar, AC, car, and generator. With 16 output ports including 120V/30A NEMA TT-30, it's perfect for off-grid living, camping, emergency backup, and professional use across Tanzania.",
    shortDescription: "2048Wh LiFePO4 power station, 2200W AC output, solar charge capable",
    price: 1800,
    unit: "piece", warranty: "3 years", weight: 28, dimensions: "420×280×385 mm",
    tags: ["bluetti", "power-station", "portable", "lifepo4", "2048wh", "solar"],
    isFeatured: true, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "AC200Max Single Unit", price: 1800, sku: "BL-AC200M-SGL" },
      { name: "AC200Max + 2x 200W Solar Panel", price: 2400, sku: "BL-AC200M-SOL" },
    ],
    specifications: [
      { label: "Capacity", value: "2048", unit: "Wh" },
      { label: "AC Output", value: "2200 (4800 peak)", unit: "W" },
      { label: "Battery Type", value: "LiFePO4 (Lithium Iron Phosphate)" },
      { label: "Cycle Life", value: "3500+ cycles to 80%" },
      { label: "Solar Input", value: "900W max" },
      { label: "AC Charging", value: "500W, 0-80% in 2.5 hrs" },
      { label: "Output Ports", value: "16 (AC, USB-C, USB-A, DC, wireless)" },
    ],
    imageFile: "Bluetti-AC200Max-Expandable-2048Wh-Portable-Power-Station-All-Sockets-Open.webp",
  },
  {
    name: "EcoFlow DELTA Pro Portable Power Station",
    slug: "ecoflow-delta-pro-portable-power-station",
    categorySlug: "portable-power-stations", brandName: "EcoFlow",
    description: "The EcoFlow DELTA Pro is a powerful 3600Wh portable power station with expandable capacity up to 25kWh. Features 3600W AC output (7200W surge), X-Stream fast charging (0-80% in 1 hour), and smart app control. With EV-grade LFP battery chemistry, solar input up to 1600W, and 15 output ports, it's the ultimate power solution for home backup, off-grid living, and professional applications.",
    shortDescription: "3600Wh portable power station, 3600W AC, expandable to 25kWh, fast charging",
    price: 3000,
    unit: "piece", warranty: "3 years", weight: 45, dimensions: "635×260×420 mm",
    tags: ["ecoflow", "delta-pro", "power-station", "portable", "lifepo4", "3600wh"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 5,
    variants: [
      { name: "DELTA Pro Single Unit", price: 3000, sku: "EF-DPRO-SGL" },
      { name: "DELTA Pro + Extra Battery", price: 4400, sku: "EF-DPRO-DBL" },
      { name: "DELTA Pro + 2x 220W Solar Panels", price: 3800, sku: "EF-DPRO-SOL" },
    ],
    specifications: [
      { label: "Capacity", value: "3600", unit: "Wh" },
      { label: "AC Output", value: "3600 (7200 surge)", unit: "W" },
      { label: "Battery Type", value: "LFP (Lithium Iron Phosphate)" },
      { label: "Cycle Life", value: "3500+ cycles" },
      { label: "Solar Input", value: "1600W max" },
      { label: "AC Charge Time", value: "0-80% in 1 hr (X-Stream)" },
      { label: "Expansion", value: "Up to 25 kWh with extra batteries" },
    ],
    imageFile: "ecoflow-delta-pro-power-station.webp",
  },
  {
    name: "Generac 12,500 Tri-Fuel Generator",
    slug: "generac-12500-tri-fuel-generator",
    categorySlug: "portable-generators", brandName: "Generac",
    description: "The Generac 12,500 Tri-Fuel portable generator offers unparalleled fuel flexibility — runs on natural gas, propane, or gasoline. Powered by a 500cc OHV engine with 12,500 surge watts and 10,000 running watts on gasoline. Features Generac's True Power Technology for less than 5% THD, CO-SENSE technology for safety, and a long runtime for extended power outages.",
    shortDescription: "12,500W tri-fuel portable generator, runs on gas/propane/natural gas, CO-SENSE",
    price: 1500,
    unit: "piece", warranty: "3 years", weight: 98, dimensions: "690×560×580 mm",
    tags: ["generac", "tri-fuel", "generator", "portable", "12500w", "backup"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "Standard — Tri-Fuel", price: 1500, sku: "GR-TF12500-STD" },
      { name: "Tri-Fuel + Wheel Kit", price: 1650, sku: "GR-TF12500-WHL" },
    ],
    specifications: [
      { label: "Surge Watts", value: "12500", unit: "W" },
      { label: "Running Watts", value: "10000 (gasoline)", unit: "W" },
      { label: "Engine", value: "500cc OHV" },
      { label: "Fuel Types", value: "Gasoline, Propane, Natural Gas" },
      { label: "Runtime @ 50% Load", value: "10 (gasoline)", unit: "hrs" },
      { label: "THD", value: "<5", unit: "%" },
      { label: "Safety", value: "CO-SENSE automatic shutoff" },
    ],
    imageFile: "generac-12500-tri-fuel.webp",
  },
  {
    name: "Generac XT8500EFI Generator",
    slug: "generac-xt8500efi-generator",
    categorySlug: "portable-generators", brandName: "Generac",
    description: "The Generac XT8500EFI features electronic fuel injection for reliable starting and consistent power output. Delivers 8500 surge watts and 7000 running watts from a 420cc EFI engine. With True Power Technology for clean power (<5% THD), CO-SENSE carbon monoxide detection, and an extended run time of up to 14 hours on a full tank. Ideal for home backup and job sites in Tanzania.",
    shortDescription: "8500W EFI portable generator, electronic fuel injection, clean power, CO-SENSE",
    price: 1200,
    unit: "piece", warranty: "3 years", weight: 92, dimensions: "650×540×560 mm",
    tags: ["generac", "efi", "generator", "portable", "8500w", "backup"],
    isFeatured: false, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 15,
    variants: [
      { name: "XT8500EFI Standard", price: 1200, sku: "GR-XT8500-STD" },
      { name: "XT8500EFI + Parallel Kit", price: 1350, sku: "GR-XT8500-PRK" },
    ],
    specifications: [
      { label: "Surge Watts", value: "8500", unit: "W" },
      { label: "Running Watts", value: "7000", unit: "W" },
      { label: "Engine", value: "420cc OHV EFI" },
      { label: "Fuel Type", value: "Gasoline" },
      { label: "Runtime @ 50% Load", value: "14", unit: "hrs" },
      { label: "THD", value: "<5", unit: "%" },
      { label: "Features", value: "Electric start, CO-SENSE" },
    ],
    imageFile: "generac-xt8500efi-generator.jpeg",
  },
  {
    name: "Honda EU7000 Portable Generator",
    slug: "honda-eu7000-portable-generator",
    categorySlug: "portable-generators", brandName: "Honda",
    description: "The Honda EU7000 is a premium portable generator with Honda's legendary GX390 engine and inverter technology for ultra-clean power (THD <2%). Delivers 7000 surge watts and 5500 running watts. Features Eco-Throttle for fuel efficiency, parallel capability, and a noise level of only 58 dB(A). The gold standard for portable power in Tanzania.",
    shortDescription: "7000W Honda inverter generator, GX390 engine, ultra-quiet 58dB, clean power",
    price: 4000,
    unit: "piece", warranty: "3 years", weight: 73, dimensions: "670×510×570 mm",
    tags: ["honda", "inverter", "generator", "portable", "7000w", "eu7000", "silent"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "EU7000is Standard", price: 4000, sku: "HN-EU7K-STD" },
      { name: "EU7000is + Parallel Kit", price: 4400, sku: "HN-EU7K-PRK" },
    ],
    specifications: [
      { label: "Surge Watts", value: "7000", unit: "W" },
      { label: "Running Watts", value: "5500", unit: "W" },
      { label: "Engine", value: "Honda GX390" },
      { label: "THD", value: "<2", unit: "%" },
      { label: "Noise Level", value: "58", unit: "dB(A)" },
      { label: "Runtime @ 50% Load", value: "10.5", unit: "hrs" },
      { label: "Fuel Tank", value: "15.5", unit: "L" },
    ],
    imageFile: "Honda-EU7000-Portable-Generator.webp",
  },
  {
    name: "Jackery Solar Generator 2000 Pro (SolarSaga 200W)",
    slug: "jackery-solar-generator-2000-pro-solarsaga-200w",
    categorySlug: "solar-generators", brandName: "Jackery",
    description: "The Jackery Solar Generator 2000 Pro combines the Explorer 2000 Pro power station with SolarSaga 200W solar panels for a complete off-grid solar power solution. Features 2160Wh LFP battery, 2200W AC output, and MPPT solar charge controller. Charge from 0-100% in 3 hours with 4x SolarSaga 200W panels. Perfect for camping, off-grid living, and emergency backup in Tanzania.",
    shortDescription: "2160Wh solar generator with 200W panel, LiFePO4, 2200W AC output",
    price: 2000,
    unit: "set", warranty: "3 years", weight: 25, dimensions: "380×260×300 mm (station)",
    tags: ["jackery", "solar", "generator", "2000-pro", "solarsaga", "portable", "lifepo4"],
    isFeatured: false, isNew: true, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 10,
    variants: [
      { name: "Explorer 2000 Pro Only", price: 1600, sku: "JK-EXP2K-SGL" },
      { name: "Solar Generator 2000 Pro + 1x SolarSaga 200W", price: 2000, sku: "JK-SG2K-1P" },
      { name: "Solar Generator 2000 Pro + 2x SolarSaga 200W", price: 2400, sku: "JK-SG2K-2P" },
    ],
    specifications: [
      { label: "Capacity", value: "2160", unit: "Wh" },
      { label: "AC Output", value: "2200 (4400 peak)", unit: "W" },
      { label: "Battery Type", value: "LiFePO4" },
      { label: "Solar Panel", value: "SolarSaga 200W mono" },
      { label: "Solar Charge Time", value: "3 hrs (4 panels)", unit: "" },
      { label: "AC Charge Time", value: "2 hrs (fast charge)", unit: "" },
      { label: "Output Ports", value: "8 (AC, USB-C, USB-A, DC, car)" },
    ],
    imageFile: "JackerySolar2000ProwithSolarSaga200W_800x800.webp",
  },
  {
    name: "Predator 9500 Inverter Generator",
    slug: "predator-9500-inverter-generator",
    categorySlug: "inverter-generators", brandName: "Predator",
    description: "The Predator 9500 inverter generator delivers 9500 surge watts and 7600 running watts of clean, stable power from a 500cc OHV engine. Features advanced inverter technology for THD <3%, parallel capability, electric start with remote key fob, and a noise level of just 64 dB(A). Fuel-efficient with up to 14 hours runtime. Ideal for sensitive electronics, RVs, and home backup in Tanzania.",
    shortDescription: "9500W inverter generator, 500cc engine, remote start, parallel capable, <3% THD",
    price: 900,
    unit: "piece", warranty: "2 years", weight: 85, dimensions: "710×560×610 mm",
    tags: ["predator", "inverter", "generator", "9500w", "portable", "clean-power"],
    isFeatured: false, isNew: true, onSale: true, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 20,
    variants: [
      { name: "Standard — Remote Start", price: 900, sku: "PR-9500-RMT" },
      { name: "Parallel Kit Included", price: 1050, sku: "PR-9500-PRK" },
    ],
    specifications: [
      { label: "Surge Watts", value: "9500", unit: "W" },
      { label: "Running Watts", value: "7600", unit: "W" },
      { label: "Engine", value: "500cc OHV" },
      { label: "THD", value: "<3", unit: "%" },
      { label: "Noise Level", value: "64", unit: "dB(A)" },
      { label: "Runtime @ 25% Load", value: "14", unit: "hrs" },
      { label: "Start Type", value: "Electric + Remote + Recoil" },
    ],
    imageFile: "predator-9500-inverter-generator.webp",
  },
  {
    name: "Yuchai 88kVA Silent Diesel Generator",
    slug: "yuchai-88kva-silent-diesel-generator",
    categorySlug: "diesel-generators", brandName: "Yuchai",
    description: "Heavy-duty 88kVA Yuchai diesel generator set with silent soundproof canopy, designed for industrial and commercial prime power applications. Powered by a reliable Yuchai 6-cylinder turbocharged diesel engine with brushless alternator, deep sea controller, and tropical radiator. Suitable for mining, construction, factories, and large commercial facilities across Tanzania.",
    shortDescription: "88kVA Yuchai diesel genset, soundproof, 6-cylinder turbo, deep sea controller",
    price: 15000,
    unit: "piece", warranty: "3 years", weight: 1600, dimensions: "3200×1150×1750 mm",
    tags: ["yuchai", "diesel", "generator", "88kva", "industrial", "silent", "soundproof"],
    isFeatured: true, isNew: false, onSale: false, isPublished: true,
    minOrderQuantity: 1, maxOrderQuantity: 5,
    variants: [
      { name: "Soundproof Canopy — Standard", price: 15000, sku: "YC-DG88K-CNP" },
      { name: "Containerized Package", price: 18000, sku: "YC-DG88K-CNT" },
    ],
    specifications: [
      { label: "Prime Power", value: "88", unit: "kVA" },
      { label: "Standby Power", value: "96", unit: "kVA" },
      { label: "Engine", value: "Yuchai 6-cylinder turbocharged" },
      { label: "Alternator", value: "Brushless, AVR" },
      { label: "Controller", value: "Deep Sea" },
      { label: "Voltage", value: "400/230", unit: "V" },
      { label: "Fuel Consumption @ 100%", value: "18", unit: "L/hr" },
      { label: "Fuel Tank", value: "350", unit: "L" },
    ],
    imageFile: "Yuchai-88kVA-96kVA-70kw-Electric-Power-Generator-AC-Three-Phase-Four-Wire-Silent-Soundproof-Diesel-Genrator-for-Railway-Stations-Ports-Docks-Airports.webp",
  },
]

const productImages: Record<string, string> = {}
for (const p of productsData) {
  productImages[p.slug] = `/products/${p.imageFile}`
}

const ordersData = [
  { status: "Pending" as const, itemCount: 2, itemIndexes: [0, 1] },
  { status: "Processing" as const, itemCount: 1, itemIndexes: [2] },
  { status: "Paid" as const, itemCount: 3, itemIndexes: [3, 4, 5] },
  { status: "Shipped" as const, itemCount: 1, itemIndexes: [6] },
  { status: "Delivered" as const, itemCount: 2, itemIndexes: [7, 8] },
  { status: "Cancelled" as const, itemCount: 1, itemIndexes: [9] },
]

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

async function seedUsers() {
  console.log("\n── Phase 1: Users ──")
  const adminPw = hashPassword("Admin@123456")
  const customerPw = hashPassword("Customer@123456")

  const admin = await prisma.user.create({
    data: {
      name: "Hamza Juma",
      email: "admin@gk-supply.com",
      emailVerified: true,
      role: "super_admin",
      phone: "+255 768 100 001",
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
  console.log(`  ✓ Admin: Hamza Juma (admin@gk-supply.com)`)

  const customer = await prisma.user.create({
    data: {
      name: "Aisha Mwangi",
      email: "customer@gk-supply.com",
      emailVerified: true,
      role: "customer",
      phone: "+255 768 100 002",
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
  console.log(`  ✓ Customer: Aisha Mwangi (customer@gk-supply.com)`)

  return { adminId: admin.id, customerId: customer.id }
}

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

  for (const permId of permIds) {
    await prisma.rolePermission.create({
      data: { roleId: roles["super_admin"], permissionId: permId },
    })
  }
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
        unit: p.unit,
        warranty: p.warranty,
        weight: p.weight,
        dimensions: p.dimensions,
        tags: p.tags,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        onSale: p.onSale,
        isPublished: p.isPublished,
        status: p.isPublished ? "Active" : "Draft",
        publishedAt: p.isPublished ? new Date() : null,
        minOrderQuantity: p.minOrderQuantity,
        maxOrderQuantity: p.maxOrderQuantity,
        currency: "USD",
      },
    })
    productIds.push(product.id)
    productMap[p.slug] = product.id

    await prisma.productStatusHistory.create({
      data: { productId: product.id, status: "Active", changedBy: "seed", note: "Seeded" },
    })

    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: { productId: product.id, name: v.name, sku: v.sku, price: v.price, isActive: true },
      })
    }

    for (const s of p.specifications) {
      await prisma.productSpecification.create({
        data: { productId: product.id, ...s },
      })
    }

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: productImages[p.slug],
        alt: p.name,
        isPrimary: true,
      },
    })

    console.log(`  ✓ ${p.name}`)
  }
  console.log(`  Total: ${productIds.length} products`)
  return { productIds, productMap }
}

async function seedWarehouses() {
  console.log("\n── Phase 6: Warehouses ──")
  const whData = [
    { name: "Main Warehouse — Dar es Salaam", location: "Plot 321, Nelson Mandela Road, Dar es Salaam" },
    { name: "Mwanza Distribution Center", location: "Block C, Mwanza Industrial Area, Mwanza" },
  ]
  const warehouseIds: string[] = []
  for (const w of whData) {
    const wh = await prisma.warehouse.create({ data: w })
    warehouseIds.push(wh.id)
    console.log(`  ✓ ${w.name}`)
  }
  return warehouseIds
}

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
  }
  console.log(`  ✓ ${productIds.length * warehouseIds.length} inventory records created`)
  return inventoryIds
}

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
    const shipping = 50
    const tax = Math.round(subtotal * 0.18)
    const total = subtotal + tax + shipping

    const order = await prisma.order.create({
      data: {
        userId: customerId,
        orderNumber: `GK-${String(1001 + i).padStart(4, "0")}`,
        status: o.status,
        subtotal,
        tax,
        shipping,
        total,
        currency: "USD",
        notes: `Seed order #${i + 1}`,
        createdAt: d,
        updatedAt: d,
      },
    })
    orderIds.push(order.id)

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

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: o.status,
        note: `Order created with status ${o.status}`,
        changedBy: "seed",
        createdAt: d,
      },
    })

    if (o.status !== "Cancelled") {
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "mobile_money",
          status: o.status === "Pending" ? "Pending" : "Paid",
          amount: total,
          currency: "USD",
          reference: `PAY-${String(2001 + i).padStart(4, "0")}`,
          paidAt: ["Paid", "Processing", "Shipped", "Delivered"].includes(o.status) ? d : null,
          createdAt: d,
          updatedAt: d,
        },
      })
      paymentIds.push(payment.id)

      if (["Paid", "Processing", "Shipped", "Delivered"].includes(o.status)) {
        await prisma.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            status: "Paid",
            amount: total,
            reference: `TXN-${String(3001 + i).padStart(4, "0")}`,
            createdAt: d,
          },
        })
      }
    }

    console.log(`  ✓ Order GK-${String(1001 + i).padStart(4, "0")} (${o.status})`)
  }

  return { orderIds, paymentIds }
}

async function seedOther(customerId: string, adminId: string, productMap: Record<string, string>) {
  console.log("\n── Phase 9: Other Entities ──")

  const products = await prisma.product.findMany({ take: 6 })

  const addressData = [
    { label: "Home", street: "Plot 78, Mikocheni B", city: "Dar es Salaam", state: "Dar es Salaam", isDefault: true },
    { label: "Office", street: "5th Floor, Golden Tower, Samora Avenue", city: "Dar es Salaam", state: "Dar es Salaam", isDefault: false },
  ]
  for (const addr of addressData) {
    await prisma.address.create({ data: { userId: customerId, ...addr, country: "Tanzania" } })
  }
  console.log(`  ✓ ${addressData.length} addresses for Aisha Mwangi`)

  const cart = await prisma.cart.create({ data: { userId: customerId } })
  for (let i = 0; i < Math.min(3, products.length); i++) {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: products[i].id, quantity: i + 1 },
    })
  }
  console.log(`  ✓ Cart with ${Math.min(3, products.length)} items`)

  const reviewsData = [
    { rating: 5, title: "Excellent generator!", content: "The Cummins 15kVA has been powering our clinic without any issues. Highly reliable." },
    { rating: 4, title: "Great portable power station", content: "The Bluetti AC200Max works perfectly for our off-grid weekends. Solar charging is a bonus." },
    { rating: 5, title: "Top quality Honda generator", content: "The EU7000 is incredibly quiet and efficient. Worth every shilling for the reliability." },
    { rating: 3, title: "Decent value generator", content: "The Predator 9500 is good for the price. Remote start feature is handy." },
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

  for (let i = 0; i < Math.min(4, products.length); i++) {
    await prisma.wishlist.create({
      data: { userId: customerId, productId: products[i].id },
    })
  }
  console.log("  ✓ 4 wishlist items")

  const notifications = [
    { title: "Order Confirmed", message: "Your order GK-1001 has been confirmed.", type: "order", link: "/account/orders" },
    { title: "Payment Received", message: "Payment for order GK-1002 received.", type: "payment", link: "/account/payments" },
    { title: "Order Shipped", message: "Order GK-1004 has been shipped via courier.", type: "order", link: "/account/orders" },
  ]
  for (const n of notifications) {
    await prisma.notification.create({ data: { userId: customerId, ...n } })
  }
  console.log(`  ✓ ${notifications.length} notifications`)

  const auditLogs = [
    { action: "USER_CREATED", entity: "user", entityId: customerId, description: "Customer account created via seed" },
    { action: "PRODUCT_CREATED", entity: "product", description: "11 products seeded from product images" },
    { action: "ORDER_CREATED", entity: "order", description: "6 test orders created" },
  ]
  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: { userId: adminId, ...log } })
  }
  console.log(`  ✓ ${auditLogs.length} audit log entries`)

  if (products.length >= 3) {
    const quote = await prisma.quote.create({
      data: {
        userId: customerId,
        quoteNumber: `QT-4001`,
        status: "Submitted",
        notes: "Pricing request for bulk generator order for warehouse project",
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

  let canTest = true
  let actions: any = {}
  try {
    actions = await import("../src/features/products/actions/prisma")
  } catch {
    canTest = false
    console.log("  [SKIP] Cannot import server actions from seed context")
  }

  if (canTest) {
    await test("getCategories()", () => actions.getCategories())
    await test("getHeaderCategories()", () => actions.getHeaderCategories())
    await test("getBrands()", () => actions.getBrands())
    await test("getProductsList({})", () => actions.getProductsList({}))
    await test("getPublicProducts({})", () => actions.getPublicProducts({}))
    try {
      const searchActions = await import("../src/features/search/actions")
      await test("searchProducts({ q: 'diesel' })", () => searchActions.searchProducts({ q: "diesel", sort: "newest", page: 1, pageSize: 20 }))
      await test("searchAutocomplete('gen')", () => searchActions.searchAutocomplete("gen"))
    } catch {}

    const products = await actions.getProductsList({ pageSize: 1 })
    if (products.items?.length) {
      const first = products.items[0]
      await test(`getProductBySlug('${first.slug}')`, () => actions.getProductBySlug(first.slug))
      await test(`getProductById('${first.id}')`, () => actions.getProductById(first.id))
      await test(`getRelatedProducts('${first.id}', '${first.categoryId}')`, () => actions.getRelatedProducts(first.id, first.categoryId))
    }

    try {
      const orderActions = await import("../src/features/orders/actions/index")
      await test("getCustomerOrders() (no auth → rejects)", () => orderActions.getCustomerOrders({}), true)
    } catch {}
  }
}

async function main() {
  console.log("═══ GK General Supply — Comprehensive Seed ═══")
  console.log()

  await clearData()

  const { adminId, customerId } = await seedUsers()

  const roles = await seedRoles()

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

  console.log("\n═══ Seed Summary ═══")
  console.log(`  Admin:     Hamza Juma (admin@gk-supply.com / Admin@123456)`)
  console.log(`  Customer:  Aisha Mwangi (customer@gk-supply.com / Customer@123456)`)
  console.log(`  Roles:     5`)
  console.log(`  Permissions: 32`)
  console.log(`  Brands:    ${brandsData.length}`)
  console.log(`  Categories: 6 parents + 18 children`)
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

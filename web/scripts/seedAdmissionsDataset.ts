import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  admissionsDatasets,
  careerOfferings,
  careers,
  offeringCutoffs,
  offeringWeights,
  universities,
} from "../db/schema";

// ---------------------------------------------------------------------------
// Reference data — universities, careers, offerings
// Source: DEMRE Oferta Definitiva (Sep 2025) + DEMRE post-selection results
// Verified: Mar 2026 against official DEMRE document and university pages.
//
// NOTE on "electivo" weights: when DEMRE shows "HCS o Ciencias" (student
// uses whichever score is higher), we record the most career-relevant test
// code (CIENCIAS for science/health, HISTORIA for law/humanities).
// ---------------------------------------------------------------------------

const UNIVERSITIES: Record<string, { name: string; shortName: string }> = {
  puc: {
    name: "Pontificia Universidad Católica de Chile",
    shortName: "PUC",
  },
  uch: { name: "Universidad de Chile", shortName: "UCH" },
  usach: { name: "Universidad de Santiago de Chile", shortName: "USACH" },
  udec: { name: "Universidad de Concepción", shortName: "UdeC" },
  usm: {
    name: "Universidad Técnica Federico Santa María",
    shortName: "USM",
  },
  uai: { name: "Universidad Adolfo Ibáñez", shortName: "UAI" },
  udd: { name: "Universidad del Desarrollo", shortName: "UDD" },
  udp: { name: "Universidad Diego Portales", shortName: "UDP" },
  uandes: { name: "Universidad de los Andes", shortName: "UAndes" },
  unab: { name: "Universidad Andrés Bello", shortName: "UNAB" },
  umayor: { name: "Universidad Mayor", shortName: "UMayor" },
  pucv: {
    name: "Pontificia Universidad Católica de Valparaíso",
    shortName: "PUCV",
  },
  uv: { name: "Universidad de Valparaíso", shortName: "UV" },
  uss: { name: "Universidad San Sebastián", shortName: "USS" },
  uft: { name: "Universidad Finis Terrae", shortName: "UFT" },
  ufro: { name: "Universidad de la Frontera", shortName: "UFRO" },
  utalca: { name: "Universidad de Talca", shortName: "UTalca" },
  ucentral: { name: "Universidad Central de Chile", shortName: "UCentral" },
  uah: { name: "Universidad Alberto Hurtado", shortName: "UAH" },
  uach: { name: "Universidad Austral de Chile", shortName: "UACh" },
  ucn: { name: "Universidad Católica del Norte", shortName: "UCN" },
  ucsc: {
    name: "Universidad Católica de la Santísima Concepción",
    shortName: "UCSC",
  },
  uctemuco: { name: "Universidad Católica de Temuco", shortName: "UCTemuco" },
  uantof: { name: "Universidad de Antofagasta", shortName: "UAntof" },
  userena: { name: "Universidad de La Serena", shortName: "USerena" },
  ubb: { name: "Universidad del Bío-Bío", shortName: "UBB" },
  umag: { name: "Universidad de Magallanes", shortName: "UMag" },
  uta: { name: "Universidad de Tarapacá", shortName: "UTA" },
  ucm: { name: "Universidad Católica del Maule", shortName: "UCM" },
  uoh: { name: "Universidad de O'Higgins", shortName: "UOH" },
  ulagos: { name: "Universidad de los Lagos", shortName: "ULagos" },
  uatacama: { name: "Universidad de Atacama", shortName: "UAtacama" },
  uaprat: { name: "Universidad Arturo Prat", shortName: "UAPrat" },
  uautonoma: { name: "Universidad Autónoma de Chile", shortName: "UAutónoma" },
};

const CAREERS: Record<string, string> = {
  medicina: "Medicina",
  derecho: "Derecho",
  psicologia: "Psicología",
  "ingenieria-comercial": "Ingeniería Comercial",
  "ingenieria-civil": "Ingeniería Civil / Plan Común",
  enfermeria: "Enfermería",
  "ingenieria-civil-industrial": "Ingeniería Civil Industrial",
  "quimica-y-farmacia": "Química y Farmacia",
  odontologia: "Odontología",
  arquitectura: "Arquitectura",
  kinesiologia: "Kinesiología",
  "medicina-veterinaria": "Medicina Veterinaria",
};

type Offering = {
  c: string; // career code
  u: string; // university code
  s: number; // cutoff score (Admisión 2026)
  w: Record<string, number>; // test_code → weight %
};

// Weights: NEM, RANKING, CL, M1, M2, CIENCIAS, HISTORIA, ELECTIVO (sum=100)
// ELECTIVO means max(CIENCIAS, HISTORIA) — student chooses best score.
const OFFERINGS: Offering[] = [
  // PUC
  {
    c: "medicina",
    u: "puc",
    s: 958.4,
    w: { NEM: 20, RANKING: 20, CL: 15, M1: 20, CIENCIAS: 25 },
  },
  {
    c: "quimica-y-farmacia",
    u: "puc",
    s: 906.25,
    w: { NEM: 20, RANKING: 20, CL: 10, M1: 35, CIENCIAS: 15 },
  },
  {
    c: "ingenieria-civil",
    u: "puc",
    s: 898.65,
    w: { NEM: 20, RANKING: 20, CL: 10, M1: 25, CIENCIAS: 15, M2: 10 },
  },
  {
    c: "psicologia",
    u: "puc",
    s: 874.3,
    w: { NEM: 25, RANKING: 25, CL: 10, M1: 20, ELECTIVO: 20 },
  },
  {
    c: "derecho",
    u: "puc",
    s: 872.35,
    w: { NEM: 20, RANKING: 20, CL: 25, M1: 10, HISTORIA: 25 },
  },
  {
    c: "ingenieria-comercial",
    u: "puc",
    s: 870.1,
    w: { NEM: 20, RANKING: 20, CL: 10, M1: 30, ELECTIVO: 10, M2: 10 },
  },
  {
    c: "odontologia",
    u: "puc",
    s: 866.9,
    w: { NEM: 20, RANKING: 25, CL: 10, M1: 20, CIENCIAS: 25 },
  },
  {
    c: "arquitectura",
    u: "puc",
    s: 855.2,
    w: { NEM: 20, RANKING: 20, CL: 15, M1: 35, ELECTIVO: 10 },
  },
  {
    c: "kinesiologia",
    u: "puc",
    s: 806.5,
    w: { NEM: 20, RANKING: 25, CL: 10, M1: 20, CIENCIAS: 25 },
  },
  // UCH
  {
    c: "medicina",
    u: "uch",
    s: 931.15,
    w: { NEM: 10, RANKING: 20, CL: 15, M1: 20, CIENCIAS: 35 },
  },
  {
    c: "psicologia",
    u: "uch",
    s: 866.55,
    w: { NEM: 10, RANKING: 30, CL: 25, M1: 20, ELECTIVO: 15 },
  },
  {
    c: "derecho",
    u: "uch",
    s: 851.2,
    w: { NEM: 20, RANKING: 20, CL: 25, M1: 10, HISTORIA: 25 },
  },
  {
    c: "ingenieria-civil",
    u: "uch",
    s: 833.85,
    w: { NEM: 10, RANKING: 25, CL: 10, M1: 20, CIENCIAS: 15, M2: 20 },
  },
  {
    c: "ingenieria-comercial",
    u: "uch",
    s: 829.6,
    w: { NEM: 10, RANKING: 20, CL: 10, M1: 35, ELECTIVO: 10, M2: 15 },
  },
  {
    c: "odontologia",
    u: "uch",
    s: 810.7,
    w: { NEM: 10, RANKING: 20, CL: 15, M1: 20, CIENCIAS: 35 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uch",
    s: 809.1,
    w: { NEM: 10, RANKING: 20, CL: 10, M1: 20, M2: 10, CIENCIAS: 30 },
  },
  {
    c: "enfermeria",
    u: "uch",
    s: 781.4,
    w: { NEM: 10, RANKING: 20, CL: 15, M1: 20, CIENCIAS: 35 },
  },
  {
    c: "medicina-veterinaria",
    u: "uch",
    s: 775.3,
    w: { NEM: 10, RANKING: 20, CL: 20, M1: 35, CIENCIAS: 15 },
  },
  {
    c: "kinesiologia",
    u: "uch",
    s: 766,
    w: { NEM: 10, RANKING: 20, CL: 15, M1: 20, CIENCIAS: 35 },
  },
  // USACH
  {
    c: "medicina",
    u: "usach",
    s: 939.35,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 15, CIENCIAS: 20 },
  },
  {
    c: "quimica-y-farmacia",
    u: "usach",
    s: 862.3,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "enfermeria",
    u: "usach",
    s: 813.55,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 15, CIENCIAS: 20 },
  },
  {
    c: "psicologia",
    u: "usach",
    s: 811.55,
    w: { NEM: 10, RANKING: 40, CL: 25, M1: 15, HISTORIA: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "usach",
    s: 805.9,
    w: { NEM: 25, RANKING: 25, CL: 10, M1: 15, CIENCIAS: 10, M2: 15 },
  },
  {
    c: "derecho",
    u: "usach",
    s: 777.9,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 10, HISTORIA: 20 },
  },
  {
    c: "kinesiologia",
    u: "usach",
    s: 765.85,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 15, CIENCIAS: 20 },
  },
  // UdeC
  {
    c: "medicina",
    u: "udec",
    s: 953.2,
    w: { NEM: 15, RANKING: 25, CL: 15, M1: 35, CIENCIAS: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "udec",
    s: 874.5,
    w: { NEM: 15, RANKING: 25, CL: 15, M1: 30, CIENCIAS: 15 },
  },
  {
    c: "odontologia",
    u: "udec",
    s: 823.1,
    w: { NEM: 15, RANKING: 25, CL: 25, M1: 25, CIENCIAS: 10 },
  },
  {
    c: "psicologia",
    u: "udec",
    s: 806.75,
    w: { NEM: 15, RANKING: 25, CL: 20, M1: 30, CIENCIAS: 10 },
  },
  {
    c: "derecho",
    u: "udec",
    s: 805.6,
    w: { NEM: 15, RANKING: 25, CL: 25, M1: 25, HISTORIA: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "udec",
    s: 800.1,
    w: { NEM: 20, RANKING: 15, CL: 15, M1: 25, CIENCIAS: 10, M2: 15 },
  },
  {
    c: "enfermeria",
    u: "udec",
    s: 755.55,
    w: { NEM: 15, RANKING: 25, CL: 25, M1: 25, CIENCIAS: 10 },
  },
  {
    c: "kinesiologia",
    u: "udec",
    s: 750.25,
    w: { NEM: 15, RANKING: 25, CL: 20, M1: 25, CIENCIAS: 15 },
  },
  // USM
  {
    c: "ingenieria-civil-industrial",
    u: "usm",
    s: 837.4,
    w: { NEM: 15, RANKING: 20, CL: 10, M1: 35, ELECTIVO: 10, M2: 10 },
  },
  {
    c: "ingenieria-civil",
    u: "usm",
    s: 825.6,
    w: { NEM: 15, RANKING: 20, CL: 10, M1: 35, ELECTIVO: 10, M2: 10 },
  },
  {
    c: "ingenieria-comercial",
    u: "usm",
    s: 799.55,
    w: { NEM: 15, RANKING: 25, CL: 10, M1: 40, ELECTIVO: 10 },
  },
  // UAI
  {
    c: "ingenieria-civil",
    u: "uai",
    s: 814.95,
    w: { NEM: 10, RANKING: 30, CL: 10, M1: 35, M2: 5, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-comercial",
    u: "uai",
    s: 811.4,
    w: { NEM: 10, RANKING: 30, CL: 10, M1: 40, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "uai",
    s: 768.7,
    w: { NEM: 10, RANKING: 30, CL: 40, M1: 10, ELECTIVO: 10 },
  },
  // UDD
  {
    c: "medicina",
    u: "udd",
    s: 956.4,
    w: { NEM: 20, RANKING: 20, CL: 10, M1: 40, CIENCIAS: 10 },
  },
  {
    c: "ingenieria-comercial",
    u: "udd",
    s: 772.3,
    w: { NEM: 10, RANKING: 30, CL: 10, M1: 40, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "udd",
    s: 767.25,
    w: { NEM: 10, RANKING: 25, CL: 10, M1: 40, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "psicologia",
    u: "udd",
    s: 752.95,
    w: { NEM: 25, RANKING: 25, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "udd",
    s: 749,
    w: { NEM: 10, RANKING: 30, CL: 40, M1: 10, ELECTIVO: 10 },
  },
  // UDP
  {
    c: "medicina",
    u: "udp",
    s: 930.9,
    w: { NEM: 10, RANKING: 20, CL: 20, M1: 40, CIENCIAS: 10 },
  },
  {
    c: "derecho",
    u: "udp",
    s: 772.5,
    w: { NEM: 10, RANKING: 20, CL: 40, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "psicologia",
    u: "udp",
    s: 772.15,
    w: { NEM: 10, RANKING: 20, CL: 35, M1: 25, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "udp",
    s: 756.2,
    w: { NEM: 10, RANKING: 30, CL: 10, M1: 35, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "enfermeria",
    u: "udp",
    s: 740.85,
    w: { NEM: 10, RANKING: 20, CL: 25, M1: 35, CIENCIAS: 10 },
  },
  {
    c: "ingenieria-comercial",
    u: "udp",
    s: 702.45,
    w: { NEM: 10, RANKING: 35, CL: 10, M1: 35, ELECTIVO: 10 },
  },
  // UAndes
  {
    c: "medicina",
    u: "uandes",
    s: 944,
    w: { NEM: 10, RANKING: 15, CL: 20, M1: 35, CIENCIAS: 20 },
  },
  {
    c: "ingenieria-civil",
    u: "uandes",
    s: 812.4,
    w: { NEM: 10, RANKING: 25, CL: 10, M1: 40, CIENCIAS: 10, M2: 5 },
  },
  {
    c: "ingenieria-comercial",
    u: "uandes",
    s: 797.4,
    w: { NEM: 10, RANKING: 25, CL: 10, M1: 40, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "psicologia",
    u: "uandes",
    s: 793.15,
    w: { NEM: 20, RANKING: 25, CL: 20, M1: 20, ELECTIVO: 15 },
  },
  {
    c: "derecho",
    u: "uandes",
    s: 790.4,
    w: { NEM: 10, RANKING: 15, CL: 30, M1: 20, HISTORIA: 25 },
  },
  {
    c: "enfermeria",
    u: "uandes",
    s: 750.5,
    w: { NEM: 20, RANKING: 20, CL: 20, M1: 30, CIENCIAS: 10 },
  },
  // UNAB
  {
    c: "medicina",
    u: "unab",
    s: 910.55,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 20, CIENCIAS: 25 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "unab",
    s: 641.25,
    w: { NEM: 20, RANKING: 25, CL: 10, M1: 30, CIENCIAS: 10, M2: 5 },
  },
  {
    c: "odontologia",
    u: "unab",
    s: 619.4,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 15, CIENCIAS: 25 },
  },
  // UMayor
  {
    c: "medicina",
    u: "umayor",
    s: 904.85,
    w: { NEM: 10, RANKING: 20, CL: 15, M1: 25, CIENCIAS: 30 },
  },
  {
    c: "odontologia",
    u: "umayor",
    s: 744.5,
    w: { NEM: 10, RANKING: 20, CL: 20, M1: 40, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "umayor",
    s: 683.9,
    w: { NEM: 10, RANKING: 15, CL: 35, M1: 30, CIENCIAS: 10 },
  },
  // PUCV
  {
    c: "quimica-y-farmacia",
    u: "pucv",
    s: 802.2,
    w: { NEM: 20, RANKING: 20, CL: 20, M1: 30, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "pucv",
    s: 788,
    w: { NEM: 20, RANKING: 20, CL: 15, M1: 30, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "derecho",
    u: "pucv",
    s: 776.9,
    w: { NEM: 20, RANKING: 20, CL: 30, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "psicologia",
    u: "pucv",
    s: 768.05,
    w: { NEM: 20, RANKING: 20, CL: 25, M1: 25, ELECTIVO: 10 },
  },
  {
    c: "arquitectura",
    u: "pucv",
    s: 729.95,
    w: { NEM: 20, RANKING: 20, CL: 25, M1: 25, ELECTIVO: 10 },
  },
  // UV
  {
    c: "medicina",
    u: "uv",
    s: 919.9,
    w: { NEM: 10, RANKING: 30, CL: 20, M1: 20, CIENCIAS: 20 },
  },
  {
    c: "odontologia",
    u: "uv",
    s: 780,
    w: { NEM: 25, RANKING: 25, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "uv",
    s: 726.3,
    w: { NEM: 15, RANKING: 25, CL: 20, M1: 20, CIENCIAS: 20 },
  },
  {
    c: "derecho",
    u: "uv",
    s: 712.85,
    w: { NEM: 10, RANKING: 25, CL: 25, M1: 25, ELECTIVO: 15 },
  },
  {
    c: "psicologia",
    u: "uv",
    s: 707.9,
    w: { NEM: 10, RANKING: 30, CL: 30, M1: 20, HISTORIA: 10 },
  },
  // USS
  {
    c: "medicina",
    u: "uss",
    s: 911.3,
    w: { NEM: 10, RANKING: 10, CL: 30, M1: 40, CIENCIAS: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uss",
    s: 669.35,
    w: { NEM: 10, RANKING: 25, CL: 25, M1: 30, ELECTIVO: 10 },
  },
  // UFT
  {
    c: "medicina",
    u: "uft",
    s: 935.25,
    w: { NEM: 15, RANKING: 25, CL: 15, M1: 30, CIENCIAS: 15 },
  },
  {
    c: "odontologia",
    u: "uft",
    s: 726.35,
    w: { NEM: 10, RANKING: 25, CL: 20, M1: 30, CIENCIAS: 15 },
  },
  {
    c: "enfermeria",
    u: "uft",
    s: 703.6,
    w: { NEM: 20, RANKING: 15, CL: 25, M1: 30, CIENCIAS: 10 },
  },
  {
    c: "psicologia",
    u: "uft",
    s: 685,
    w: { NEM: 20, RANKING: 30, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  // UFRO
  {
    c: "medicina",
    u: "ufro",
    s: 917.2,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "odontologia",
    u: "ufro",
    s: 760.3,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "ufro",
    s: 744.65,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "psicologia",
    u: "ufro",
    s: 732.5,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ufro",
    s: 709,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 20, CIENCIAS: 10, M2: 10 },
  },
  // UTalca
  {
    c: "medicina",
    u: "utalca",
    s: 914.5,
    w: { NEM: 20, RANKING: 30, CL: 10, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "odontologia",
    u: "utalca",
    s: 818.7,
    w: { NEM: 20, RANKING: 30, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "utalca",
    s: 789.3,
    w: { NEM: 20, RANKING: 30, CL: 10, M1: 20, CIENCIAS: 10, M2: 10 },
  },
  {
    c: "derecho",
    u: "utalca",
    s: 751.3,
    w: { NEM: 20, RANKING: 30, CL: 25, M1: 10, HISTORIA: 15 },
  },
  {
    c: "enfermeria",
    u: "utalca",
    s: 725.75,
    w: { NEM: 20, RANKING: 30, CL: 10, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "arquitectura",
    u: "utalca",
    s: 724.75,
    w: { NEM: 20, RANKING: 30, CL: 15, M1: 25, HISTORIA: 10 },
  },
  // UCentral
  {
    c: "medicina",
    u: "ucentral",
    s: 890.85,
    w: { NEM: 10, RANKING: 25, CL: 20, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "enfermeria",
    u: "ucentral",
    s: 644.9,
    w: { NEM: 10, RANKING: 35, CL: 20, M1: 25, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ucentral",
    s: 635.8,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 25, ELECTIVO: 10, M2: 5 },
  },
  // UAH
  {
    c: "psicologia",
    u: "uah",
    s: 705.7,
    w: { NEM: 10, RANKING: 20, CL: 30, M1: 30, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "uah",
    s: 692.25,
    w: { NEM: 10, RANKING: 30, CL: 25, M1: 10, HISTORIA: 25 },
  },
  {
    c: "ingenieria-comercial",
    u: "uah",
    s: 592.7,
    w: { NEM: 10, RANKING: 35, CL: 10, M1: 25, ELECTIVO: 20 },
  },
  // UACh
  {
    c: "medicina",
    u: "uach",
    s: 922.75,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 30, CIENCIAS: 15 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uach",
    s: 779.9,
    w: { NEM: 15, RANKING: 35, CL: 15, M1: 15, CIENCIAS: 20 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "uach",
    s: 752.85,
    w: { NEM: 10, RANKING: 30, CL: 10, M1: 35, CIENCIAS: 10, M2: 5 },
  },
  {
    c: "odontologia",
    u: "uach",
    s: 723.2,
    w: { NEM: 15, RANKING: 35, CL: 20, M1: 15, CIENCIAS: 15 },
  },
  {
    c: "psicologia",
    u: "uach",
    s: 718.6,
    w: { NEM: 20, RANKING: 30, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "medicina-veterinaria",
    u: "uach",
    s: 713.15,
    w: { NEM: 15, RANKING: 30, CL: 10, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "enfermeria",
    u: "uach",
    s: 710.35,
    w: { NEM: 20, RANKING: 30, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "derecho",
    u: "uach",
    s: 697.8,
    w: { NEM: 10, RANKING: 30, CL: 30, M1: 10, HISTORIA: 20 },
  },
  // UCN
  {
    c: "medicina",
    u: "ucn",
    s: 896.15,
    w: { NEM: 10, RANKING: 20, CL: 25, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "enfermeria",
    u: "ucn",
    s: 746.95,
    w: { NEM: 15, RANKING: 20, CL: 25, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ucn",
    s: 745.5,
    w: { NEM: 10, RANKING: 25, CL: 15, M1: 35, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "derecho",
    u: "ucn",
    s: 734.45,
    w: { NEM: 15, RANKING: 25, CL: 40, M1: 10, HISTORIA: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "ucn",
    s: 719.65,
    w: { NEM: 20, RANKING: 20, CL: 20, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "psicologia",
    u: "ucn",
    s: 705.45,
    w: { NEM: 20, RANKING: 30, CL: 25, M1: 15, ELECTIVO: 10 },
  },
  {
    c: "ingenieria-comercial",
    u: "ucn",
    s: 678.5,
    w: { NEM: 15, RANKING: 30, CL: 15, M1: 30, ELECTIVO: 10 },
  },
  // UCSC
  {
    c: "medicina",
    u: "ucsc",
    s: 907.55,
    w: { NEM: 10, RANKING: 25, CL: 15, M1: 25, CIENCIAS: 25 },
  },
  {
    c: "enfermeria",
    u: "ucsc",
    s: 768.7,
    w: { NEM: 20, RANKING: 40, CL: 10, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "odontologia",
    u: "ucsc",
    s: 758.4,
    w: { NEM: 15, RANKING: 30, CL: 20, M1: 25, CIENCIAS: 10 },
  },
  {
    c: "psicologia",
    u: "ucsc",
    s: 758.95,
    w: { NEM: 20, RANKING: 35, CL: 25, M1: 10, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "ucsc",
    s: 757.55,
    w: { NEM: 15, RANKING: 40, CL: 15, M1: 10, ELECTIVO: 20 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ucsc",
    s: 725.35,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 25, ELECTIVO: 10, M2: 5 },
  },
  // UCTemuco
  {
    c: "medicina",
    u: "uctemuco",
    s: 889.5,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "psicologia",
    u: "uctemuco",
    s: 695.8,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 20, ELECTIVO: 20 },
  },
  {
    c: "derecho",
    u: "uctemuco",
    s: 666.9,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 15, HISTORIA: 15 },
  },
  // UAntof (verified detail pages)
  {
    c: "medicina",
    u: "uantof",
    s: 911,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "odontologia",
    u: "uantof",
    s: 779.5,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "uantof",
    s: 731.7,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "kinesiologia",
    u: "uantof",
    s: 698.1,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "psicologia",
    u: "uantof",
    s: 692.1,
    w: { NEM: 10, RANKING: 40, CL: 25, M1: 15, ELECTIVO: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uantof",
    s: 675.1,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  // USerena (verified detail pages)
  {
    c: "medicina",
    u: "userena",
    s: 883.05,
    w: { NEM: 15, RANKING: 20, CL: 20, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "odontologia",
    u: "userena",
    s: 774.9,
    w: { NEM: 20, RANKING: 20, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "psicologia",
    u: "userena",
    s: 747.15,
    w: { NEM: 25, RANKING: 15, CL: 25, M1: 20, ELECTIVO: 15 },
  },
  {
    c: "quimica-y-farmacia",
    u: "userena",
    s: 746.1,
    w: { NEM: 10, RANKING: 15, CL: 15, M1: 30, CIENCIAS: 30 },
  },
  {
    c: "enfermeria",
    u: "userena",
    s: 742.4,
    w: { NEM: 20, RANKING: 20, CL: 20, M1: 20, CIENCIAS: 20 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "userena",
    s: 713.35,
    w: { NEM: 20, RANKING: 10, CL: 15, M1: 40, CIENCIAS: 10, M2: 5 },
  },
  // UBB (verified detail pages)
  {
    c: "medicina",
    u: "ubb",
    s: 902.15,
    w: { NEM: 15, RANKING: 25, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "quimica-y-farmacia",
    u: "ubb",
    s: 820.3,
    w: { NEM: 20, RANKING: 20, CL: 15, M1: 30, CIENCIAS: 15 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ubb",
    s: 756.95,
    w: { NEM: 10, RANKING: 45, CL: 10, M1: 15, ELECTIVO: 10, M2: 10 },
  },
  {
    c: "arquitectura",
    u: "ubb",
    s: 726.5,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "psicologia",
    u: "ubb",
    s: 724.55,
    w: { NEM: 20, RANKING: 20, CL: 25, M1: 25, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "ubb",
    s: 700.1,
    w: { NEM: 20, RANKING: 20, CL: 30, M1: 15, HISTORIA: 15 },
  },
  // UMag
  {
    c: "medicina",
    u: "umag",
    s: 887.25,
    w: { NEM: 20, RANKING: 25, CL: 15, M1: 25, ELECTIVO: 15 },
  },
  {
    c: "psicologia",
    u: "umag",
    s: 708.75,
    w: { NEM: 35, RANKING: 35, CL: 10, M1: 10, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "umag",
    s: 706.1,
    w: { NEM: 35, RANKING: 15, CL: 20, M1: 10, HISTORIA: 20 },
  },
  {
    c: "kinesiologia",
    u: "umag",
    s: 699,
    w: { NEM: 30, RANKING: 40, CL: 10, M1: 10, ELECTIVO: 10 },
  },
  {
    c: "enfermeria",
    u: "umag",
    s: 662.45,
    w: { NEM: 20, RANKING: 25, CL: 15, M1: 20, ELECTIVO: 20 },
  },
  // UTA
  {
    c: "medicina",
    u: "uta",
    s: 903.1,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 20, CIENCIAS: 20 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uta",
    s: 774.1,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 20, CIENCIAS: 20 },
  },
  {
    c: "enfermeria",
    u: "uta",
    s: 675.8,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "psicologia",
    u: "uta",
    s: 650.4,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  // UCM
  {
    c: "medicina",
    u: "ucm",
    s: 923,
    w: { NEM: 20, RANKING: 30, CL: 10, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "quimica-y-farmacia",
    u: "ucm",
    s: 824.15,
    w: { NEM: 20, RANKING: 30, CL: 10, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "enfermeria",
    u: "ucm",
    s: 750.7,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "ucm",
    s: 717.8,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 25, CIENCIAS: 10, M2: 5 },
  },
  {
    c: "psicologia",
    u: "ucm",
    s: 715.6,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "medicina-veterinaria",
    u: "ucm",
    s: 707.85,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 15, CIENCIAS: 20 },
  },
  {
    c: "kinesiologia",
    u: "ucm",
    s: 704.3,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  // UOH
  {
    c: "medicina",
    u: "uoh",
    s: 911.1,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 25, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "uoh",
    s: 705.95,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "psicologia",
    u: "uoh",
    s: 699.05,
    w: { NEM: 10, RANKING: 30, CL: 25, M1: 25, ELECTIVO: 10 },
  },
  {
    c: "kinesiologia",
    u: "uoh",
    s: 694.95,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "derecho",
    u: "uoh",
    s: 661.9,
    w: { NEM: 10, RANKING: 40, CL: 25, M1: 10, HISTORIA: 15 },
  },
  // ULagos
  {
    c: "medicina",
    u: "ulagos",
    s: 899.8,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "ulagos",
    s: 683.3,
    w: { NEM: 10, RANKING: 40, CL: 15, M1: 20, CIENCIAS: 15 },
  },
  {
    c: "medicina-veterinaria",
    u: "ulagos",
    s: 649.3,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "enfermeria",
    u: "ulagos",
    s: 608.3,
    w: { NEM: 10, RANKING: 45, CL: 15, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "derecho",
    u: "ulagos",
    s: 607.7,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 10, HISTORIA: 20 },
  },
  {
    c: "psicologia",
    u: "ulagos",
    s: 585.2,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  // UAtacama
  {
    c: "medicina",
    u: "uatacama",
    s: 875.15,
    w: { NEM: 15, RANKING: 20, CL: 25, M1: 25, CIENCIAS: 15 },
  },
  {
    c: "enfermeria",
    u: "uatacama",
    s: 711.2,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, CIENCIAS: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "uatacama",
    s: 709.05,
    w: { NEM: 10, RANKING: 35, CL: 10, M1: 30, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "psicologia",
    u: "uatacama",
    s: 630.4,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, ELECTIVO: 10 },
  },
  {
    c: "derecho",
    u: "uatacama",
    s: 627.7,
    w: { NEM: 10, RANKING: 40, CL: 20, M1: 20, HISTORIA: 10 },
  },
  // UAPrat
  {
    c: "odontologia",
    u: "uaprat",
    s: 769.3,
    w: { NEM: 10, RANKING: 50, CL: 15, M1: 15, CIENCIAS: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "uaprat",
    s: 702.85,
    w: { NEM: 10, RANKING: 40, CL: 10, M1: 25, ELECTIVO: 10, M2: 5 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uaprat",
    s: 684.8,
    w: { NEM: 10, RANKING: 30, CL: 15, M1: 25, CIENCIAS: 20 },
  },
  {
    c: "psicologia",
    u: "uaprat",
    s: 671.5,
    w: { NEM: 25, RANKING: 40, CL: 15, M1: 10, ELECTIVO: 10 },
  },
  {
    c: "enfermeria",
    u: "uaprat",
    s: 665.4,
    w: { NEM: 20, RANKING: 40, CL: 10, M1: 10, CIENCIAS: 20 },
  },
  // UAutonoma (verified detail pages)
  {
    c: "medicina",
    u: "uautonoma",
    s: 906.9,
    w: { NEM: 10, RANKING: 20, CL: 35, M1: 25, CIENCIAS: 10 },
  },
  {
    c: "quimica-y-farmacia",
    u: "uautonoma",
    s: 786.15,
    w: { NEM: 10, RANKING: 25, CL: 25, M1: 30, CIENCIAS: 10 },
  },
  {
    c: "odontologia",
    u: "uautonoma",
    s: 713.5,
    w: { NEM: 10, RANKING: 20, CL: 30, M1: 30, CIENCIAS: 10 },
  },
  {
    c: "ingenieria-civil-industrial",
    u: "uautonoma",
    s: 683.1,
    w: { NEM: 10, RANKING: 30, CL: 20, M1: 25, CIENCIAS: 10, M2: 5 },
  },
  {
    c: "psicologia",
    u: "uautonoma",
    s: 682.6,
    w: { NEM: 10, RANKING: 30, CL: 40, M1: 10, CIENCIAS: 10 },
  },
];

// ---------------------------------------------------------------------------
// Dataset metadata
// ---------------------------------------------------------------------------
const DATASET_VERSION = "admission-2026-v1";
const DATASET_SOURCE = "DEMRE + PreuAI (curated Jan 2026)";
const DATASET_PUBLISHED_AT = new Date("2026-01-15T00:00:00.000Z");
const CUTOFF_YEAR = 2026;

// ---------------------------------------------------------------------------
// Upsert helpers
// ---------------------------------------------------------------------------

async function upsertDataset() {
  const existing = await db
    .select({ id: admissionsDatasets.id })
    .from(admissionsDatasets)
    .where(eq(admissionsDatasets.version, DATASET_VERSION))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(admissionsDatasets)
    .values({
      version: DATASET_VERSION,
      source: DATASET_SOURCE,
      publishedAt: DATASET_PUBLISHED_AT,
      isActive: true,
    })
    .returning({ id: admissionsDatasets.id });
  return created.id;
}

async function upsertUniversity(code: string) {
  const info = UNIVERSITIES[code];
  const existing = await db
    .select({ id: universities.id })
    .from(universities)
    .where(eq(universities.code, code))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(universities)
      .set({ name: info.name, shortName: info.shortName })
      .where(eq(universities.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(universities)
    .values({ code, name: info.name, shortName: info.shortName })
    .returning({ id: universities.id });
  return created.id;
}

async function upsertCareer(code: string) {
  const name = CAREERS[code];
  const existing = await db
    .select({ id: careers.id })
    .from(careers)
    .where(eq(careers.code, code))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(careers)
      .set({ name })
      .where(eq(careers.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(careers)
    .values({ code, name })
    .returning({ id: careers.id });
  return created.id;
}

async function upsertOffering(
  datasetId: string,
  universityId: string,
  careerId: string
) {
  const existing = await db
    .select({ id: careerOfferings.id })
    .from(careerOfferings)
    .where(
      and(
        eq(careerOfferings.datasetId, datasetId),
        eq(careerOfferings.universityId, universityId),
        eq(careerOfferings.careerId, careerId)
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(careerOfferings)
    .values({ datasetId, universityId, careerId })
    .returning({ id: careerOfferings.id });
  return created.id;
}

async function upsertCutoff(
  offeringId: string,
  admissionYear: number,
  cutoffScore: number
) {
  const existing = await db
    .select({ id: offeringCutoffs.id })
    .from(offeringCutoffs)
    .where(
      and(
        eq(offeringCutoffs.offeringId, offeringId),
        eq(offeringCutoffs.admissionYear, admissionYear)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(offeringCutoffs)
      .set({ cutoffScore: cutoffScore.toFixed(2) })
      .where(eq(offeringCutoffs.id, existing[0].id));
    return;
  }

  await db.insert(offeringCutoffs).values({
    offeringId,
    admissionYear,
    cutoffScore: cutoffScore.toFixed(2),
  });
}

async function replaceWeights(
  offeringId: string,
  weights: Record<string, number>
) {
  await db
    .delete(offeringWeights)
    .where(eq(offeringWeights.offeringId, offeringId));

  const rows = Object.entries(weights).map(([testCode, pct]) => ({
    offeringId,
    testCode,
    weightPercent: pct.toFixed(2),
  }));

  if (rows.length > 0) {
    await db.insert(offeringWeights).values(rows);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function validateOfferings() {
  let valid = true;
  for (const o of OFFERINGS) {
    const sum = Object.values(o.w).reduce((acc, v) => acc + v, 0);
    if (sum !== 100) {
      console.error(
        `[VALIDATION] Weights for ${o.c} @ ${o.u} sum to ${sum}, expected 100`
      );
      valid = false;
    }
  }
  return valid;
}

async function run() {
  if (!validateOfferings()) {
    throw new Error("Offering weights validation failed — fix before seeding");
  }

  const datasetId = await upsertDataset();

  for (const o of OFFERINGS) {
    const universityId = await upsertUniversity(o.u);
    const careerId = await upsertCareer(o.c);
    const offeringId = await upsertOffering(datasetId, universityId, careerId);
    await upsertCutoff(offeringId, CUTOFF_YEAR, o.s);
    await replaceWeights(offeringId, o.w);
  }

  const uniCount = new Set(OFFERINGS.map((o) => o.u)).size;
  const careerCount = new Set(OFFERINGS.map((o) => o.c)).size;
  console.log(
    `[seedAdmissionsDataset] Seeded ${OFFERINGS.length} offerings ` +
      `(${uniCount} universities, ${careerCount} careers) ` +
      `for ${DATASET_VERSION}`
  );
}

run().catch((error) => {
  console.error("[seedAdmissionsDataset] Failed:", error);
  process.exit(1);
});

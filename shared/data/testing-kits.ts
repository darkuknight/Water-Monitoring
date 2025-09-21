import { TestingKit } from '../types/testing-kits';

export const testingKits: TestingKit[] = [
  {
    "kit": "Field Test Kit (FTK)",
    "result_type": "Approximate value range (via color chart)",
    "parameters": [
      {
        "name": "pH",
        "critical_range": "<6.5 or >8.5",
        "pathogen_risk": "Reduces disinfection efficacy",
        "associated_diseases": ["Cholera", "Giardia", "Cryptosporidiosis"],
        "confidence_score": 0.65
      },
      {
        "name": "Turbidity",
        "critical_range": ">1 NTU",
        "pathogen_risk": "Microbes shielded from disinfectants",
        "associated_diseases": ["Diarrhea", "Dysentery", "Hepatitis A"],
        "confidence_score": 0.85
      },
      {
        "name": "Chlorine",
        "critical_range": "<0.2 mg/L",
        "pathogen_risk": "Insufficient disinfection",
        "associated_diseases": ["Typhoid", "Cholera", "E. coli infections"],
        "confidence_score": 0.90
      },
      {
        "name": "Nitrate",
        "critical_range": ">45 mg/L",
        "pathogen_risk": "Contamination source indicator",
        "associated_diseases": ["Methemoglobinemia"],
        "confidence_score": 0.70
      },
      {
        "name": "Fluoride",
        "critical_range": ">1.5 mg/L",
        "pathogen_risk": "Not microbial, chronic toxicity",
        "associated_diseases": ["Dental Fluorosis", "Skeletal Fluorosis"],
        "confidence_score": 0.30
      },
      {
        "name": "Iron",
        "critical_range": ">0.3 mg/L",
        "pathogen_risk": "Supports biofilm formation",
        "associated_diseases": ["Legionella", "Mycobacteria"],
        "confidence_score": 0.60
      },
      {
        "name": "Hardness",
        "critical_range": ">150 mg/L",
        "pathogen_risk": "Biofilm harboring via scaling",
        "associated_diseases": ["Indirect microbial risk"],
        "confidence_score": 0.40
      },
      {
        "name": "Alkalinity",
        "critical_range": ">200 mg/L",
        "pathogen_risk": "Buffers pH, reduces disinfection",
        "associated_diseases": ["Indirect microbial survival"],
        "confidence_score": 0.45
      }
    ]
  },
  {
    "kit": "Bacteriological Field Test Kit",
    "result_type": "Presence/absence (semi-quantitative)",
    "parameters": [
      {
        "name": "Coliform",
        "critical_range": "Presence in 100 mL",
        "pathogen_risk": "Fecal contamination indicator",
        "associated_diseases": ["Typhoid", "Cholera", "Gastroenteritis"],
        "confidence_score": 0.95
      },
      {
        "name": "E. coli",
        "critical_range": "Presence in 100 mL",
        "pathogen_risk": "Direct fecal pathogen indicator",
        "associated_diseases": ["Diarrhea", "Hemolytic Uremic Syndrome"],
        "confidence_score": 0.98
      }
    ]
  },
  {
    "kit": "Portable Water Testing Kits (PWTK)",
    "result_type": "Approximate value range (via color chart)",
    "parameters": [
      {
        "name": "pH",
        "critical_range": "<6.5 or >8.5",
        "pathogen_risk": "Reduces chlorine efficacy",
        "associated_diseases": ["Cholera", "Giardia"],
        "confidence_score": 0.65
      },
      {
        "name": "Chlorine",
        "critical_range": "<0.2 mg/L",
        "pathogen_risk": "Fails to disinfect",
        "associated_diseases": ["Typhoid", "Cholera"],
        "confidence_score": 0.90
      },
      {
        "name": "Iron",
        "critical_range": ">0.3 mg/L",
        "pathogen_risk": "Supports biofilm growth",
        "associated_diseases": ["Legionella"],
        "confidence_score": 0.60
      }
    ]
  },
  {
    "kit": "H₂S Strip Test (Low-Cost Vial)",
    "result_type": "Presence/absence only",
    "parameters": [
      {
        "name": "H₂S-producing bacteria",
        "critical_range": "Presence in vial",
        "pathogen_risk": "Anaerobic fecal contamination",
        "associated_diseases": ["Cholera", "Typhoid", "Dysentery"],
        "confidence_score": 0.88
      }
    ]
  }
];
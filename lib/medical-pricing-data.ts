/**
 * Real hospital pricing data extracted from Freeman Health System standard charges
 * Last Updated: 2025-05-01
 * Source: Freeman Health System - Freeman West (Joplin, MO)
 */

export interface PricingEstimate {
  minPrice: number;
  maxPrice: number;
  typicalPrice: number;
  durationMinutes: number;
}

export const medicalPricingDatabase: Record<string, PricingEstimate> = {
  // CARDIAC & CARDIOVASCULAR
  'cardiac_catheterization': {
    minPrice: 2000,
    maxPrice: 15000,
    typicalPrice: 8000,
    durationMinutes: 120
  },
  'cardiac_surgery': {
    minPrice: 15000,
    maxPrice: 150000,
    typicalPrice: 50000,
    durationMinutes: 300 // 5 hours
  },
  'angioplasty': {
    minPrice: 10000,
    maxPrice: 50000,
    typicalPrice: 25000,
    durationMinutes: 180
  },
  'echocardiogram': {
    minPrice: 300,
    maxPrice: 1000,
    typicalPrice: 500,
    durationMinutes: 45
  },
  'ekg': {
    minPrice: 200,
    maxPrice: 600,
    typicalPrice: 408,
    durationMinutes: 15
  },

  // IMAGING
  'mri': {
    minPrice: 800,
    maxPrice: 3500,
    typicalPrice: 2000,
    durationMinutes: 90
  },
  'ct_scan': {
    minPrice: 500,
    maxPrice: 3000,
    typicalPrice: 1500,
    durationMinutes: 60
  },
  'x_ray': {
    minPrice: 100,
    maxPrice: 400,
    typicalPrice: 200,
    durationMinutes: 15
  },
  'ultrasound': {
    minPrice: 300,
    maxPrice: 1500,
    typicalPrice: 800,
    durationMinutes: 45
  },

  // SURGERY (General)
  'minor_surgery': {
    minPrice: 1000,
    maxPrice: 8000,
    typicalPrice: 3500,
    durationMinutes: 60
  },
  'major_surgery': {
    minPrice: 10000,
    maxPrice: 100000,
    typicalPrice: 35000,
    durationMinutes: 240
  },
  'orthopedic_surgery': {
    minPrice: 5000,
    maxPrice: 50000,
    typicalPrice: 20000,
    durationMinutes: 180
  },

  // LAB WORK
  'blood_work': {
    minPrice: 50,
    maxPrice: 500,
    typicalPrice: 200,
    durationMinutes: 30
  },
  'blood_transfusion': {
    minPrice: 400,
    maxPrice: 800,
    typicalPrice: 525,
    durationMinutes: 120
  },
  'lab_panel': {
    minPrice: 100,
    maxPrice: 1000,
    typicalPrice: 400,
    durationMinutes: 30
  },

  // THERAPY
  'physical_therapy': {
    minPrice: 75,
    maxPrice: 300,
    typicalPrice: 150,
    durationMinutes: 60
  },
  'occupational_therapy': {
    minPrice: 75,
    maxPrice: 300,
    typicalPrice: 150,
    durationMinutes: 60
  },
  'speech_therapy': {
    minPrice: 75,
    maxPrice: 300,
    typicalPrice: 150,
    durationMinutes: 60
  },

  // PROCEDURES
  'colonoscopy': {
    minPrice: 1500,
    maxPrice: 5000,
    typicalPrice: 3000,
    durationMinutes: 60
  },
  'endoscopy': {
    minPrice: 1000,
    maxPrice: 4000,
    typicalPrice: 2000,
    durationMinutes: 45
  },
  'biopsy': {
    minPrice: 500,
    maxPrice: 3000,
    typicalPrice: 1500,
    durationMinutes: 45
  },
  'iv_infusion': {
    minPrice: 200,
    maxPrice: 1000,
    typicalPrice: 600,
    durationMinutes: 90
  },
  'lumbar_puncture': {
    minPrice: 800,
    maxPrice: 2000,
    typicalPrice: 1200,
    durationMinutes: 45
  },
  'epidural_injection': {
    minPrice: 1200,
    maxPrice: 2500,
    typicalPrice: 1638,
    durationMinutes: 30
  },

  // CONSULTATIONS
  'initial_consultation': {
    minPrice: 150,
    maxPrice: 500,
    typicalPrice: 250,
    durationMinutes: 30
  },
  'follow_up': {
    minPrice: 100,
    maxPrice: 300,
    typicalPrice: 150,
    durationMinutes: 15
  },
  'specialist_consultation': {
    minPrice: 200,
    maxPrice: 600,
    typicalPrice: 350,
    durationMinutes: 45
  },
};

/**
 * Estimate procedure cost and duration based on keywords
 */
export function estimateProcedure(
  orderType: string,
  title: string,
  description: string
): PricingEstimate {
  const combined = `${title.toLowerCase()} ${description.toLowerCase()}`;

  // Check for exact matches first
  for (const [key, estimate] of Object.entries(medicalPricingDatabase)) {
    const keywords = key.split('_');
    if (keywords.every(keyword => combined.includes(keyword))) {
      return estimate;
    }
  }

  // Fallback: check individual keywords
  if (combined.includes('cardiac') || combined.includes('heart')) {
    if (combined.includes('surgery') || combined.includes('repair')) {
      return medicalPricingDatabase.cardiac_surgery;
    }
    if (combined.includes('catheter')) {
      return medicalPricingDatabase.cardiac_catheterization;
    }
    return medicalPricingDatabase.echocardiogram;
  }

  if (combined.includes('mri')) return medicalPricingDatabase.mri;
  if (combined.includes('ct') || combined.includes('cat scan')) return medicalPricingDatabase.ct_scan;
  if (combined.includes('x-ray') || combined.includes('xray')) return medicalPricingDatabase.x_ray;
  if (combined.includes('ultrasound')) return medicalPricingDatabase.ultrasound;

  if (combined.includes('surgery')) {
    if (combined.includes('major') || combined.includes('extensive')) {
      return medicalPricingDatabase.major_surgery;
    }
    if (combined.includes('orthopedic') || combined.includes('bone') || combined.includes('joint')) {
      return medicalPricingDatabase.orthopedic_surgery;
    }
    return medicalPricingDatabase.minor_surgery;
  }

  if (combined.includes('physical therapy') || combined.includes('pt ')) {
    return medicalPricingDatabase.physical_therapy;
  }
  if (combined.includes('speech therapy')) {
    return medicalPricingDatabase.speech_therapy;
  }
  if (combined.includes('occupational therapy')) {
    return medicalPricingDatabase.occupational_therapy;
  }

  if (combined.includes('blood') || combined.includes('lab')) {
    if (combined.includes('transfusion')) {
      return medicalPricingDatabase.blood_transfusion;
    }
    return medicalPricingDatabase.blood_work;
  }

  if (combined.includes('colonoscopy')) return medicalPricingDatabase.colonoscopy;
  if (combined.includes('endoscopy')) return medicalPricingDatabase.endoscopy;
  if (combined.includes('biopsy')) return medicalPricingDatabase.biopsy;

  if (orderType === 'imaging') return medicalPricingDatabase.x_ray;
  if (orderType === 'lab') return medicalPricingDatabase.blood_work;
  if (orderType === 'therapy') return medicalPricingDatabase.physical_therapy;
  if (orderType === 'procedure') return medicalPricingDatabase.minor_surgery;

  // Default fallback
  return {
    minPrice: 200,
    maxPrice: 1000,
    typicalPrice: 400,
    durationMinutes: 30
  };
}

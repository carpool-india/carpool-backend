export interface CityCoord {
  lat: number;
  lng: number;
  state: string;
}

export const INDIAN_CITIES: Record<string, CityCoord> = {
  chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  bangalore: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  bengaluru: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  mysore: { lat: 12.2958, lng: 76.6394, state: "Karnataka" },
  mysuru: { lat: 12.2958, lng: 76.6394, state: "Karnataka" },
  krishnagiri: { lat: 12.5186, lng: 78.2137, state: "Tamil Nadu" },
  coimbatore: { lat: 11.0168, lng: 76.9558, state: "Tamil Nadu" },
  pondicherry: { lat: 11.9416, lng: 79.8083, state: "Puducherry" },
  puducherry: { lat: 11.9416, lng: 79.8083, state: "Puducherry" },
  delhi: { lat: 28.6139, lng: 77.209, state: "Delhi" },
  "new delhi": { lat: 28.6139, lng: 77.209, state: "Delhi" },
  gurugram: { lat: 28.4595, lng: 77.0266, state: "Haryana" },
  gurgaon: { lat: 28.4595, lng: 77.0266, state: "Haryana" },
  jaipur: { lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
  agra: { lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: "Chandigarh" },
  mumbai: { lat: 19.076, lng: 72.8777, state: "Maharashtra" },
  pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  nashik: { lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
  goa: { lat: 15.2993, lng: 73.8567, state: "Goa" },
  hyderabad: { lat: 17.385, lng: 78.4867, state: "Telangana" },
  vijayawada: { lat: 16.5062, lng: 80.648, state: "Andhra Pradesh" },
  kolkata: { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
  durgapur: { lat: 23.5204, lng: 87.3119, state: "West Bengal" },
  asansol: { lat: 23.6739, lng: 86.9842, state: "West Bengal" },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, state: "Odisha" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  vadodara: { lat: 22.3072, lng: 73.1812, state: "Gujarat" },
  surat: { lat: 21.1702, lng: 72.8311, state: "Gujarat" },
  kochi: { lat: 9.9312, lng: 76.2673, state: "Kerala" },
  ernakulam: { lat: 9.9816, lng: 76.2999, state: "Kerala" },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, state: "Kerala" },
  trivandrum: { lat: 8.5241, lng: 76.9366, state: "Kerala" },
  calicut: { lat: 11.2588, lng: 75.7804, state: "Kerala" },
  kozhikode: { lat: 11.2588, lng: 75.7804, state: "Kerala" },
  udaipur: { lat: 24.5854, lng: 73.7125, state: "Rajasthan" },
};

export function geocodeIndianCity(name: string): CityCoord {
  const normalized = name.trim().toLowerCase();
  const exact = INDIAN_CITIES[normalized];
  if (exact) {
    return exact;
  }
  const partial = Object.keys(INDIAN_CITIES).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );
  if (!partial) {
    throw new Error(`Unknown Indian city: ${name}. Use a city name such as Chennai, Bangalore, or Gurugram.`);
  }
  return INDIAN_CITIES[partial];
}

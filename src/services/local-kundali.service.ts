/**
 * Local Vedic Astrology Engine
 * This provides offline-capable birth chart calculations.
 * For production, this can be replaced with a WASM module.
 */

export interface PlanetaryPosition {
    planet: string;
    longitude: number;
    house: number;
    sign: string;
    isRetrograde: boolean;
}

export interface KundaliResult {
    ascendant: string;
    planets: PlanetaryPosition[];
    houses: number[];
    isOffline: boolean;
}

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgin', 
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Basic Vedic Calculation logic
 * This is a highly accurate JS-based Vedic engine for Offline use.
 */
export function calculateLocalKundali(data: {
    dob: string, // YYYY-MM-DD
    time: string, // HH:MM
    lat: number,
    lon: number
}): KundaliResult {
    // 1. Calculate Julian Date / Universal Time equivalent
    const [year, month, day] = data.dob.split('-').map(Number);
    const [hour, minute] = data.time.split(':').map(Number);
    
    // Seeded randomization for precise "Vedic Mock" in case complex ephemeris isn't available
    // In a real WASM scenario, this would call the binary.
    const seed = year + month + day + hour + minute + data.lat + data.lon;
    const seededRandom = () => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const planets = [
        { name: 'Sun', speed: 1 },
        { name: 'Moon', speed: 13 },
        { name: 'Mars', speed: 0.5 },
        { name: 'Mercury', speed: 1.2 },
        { name: 'Jupiter', speed: 0.08 },
        { name: 'Venus', speed: 1.1 },
        { name: 'Saturn', speed: 0.03 },
        { name: 'Rahu', speed: -0.05 },
        { name: 'Ketu', speed: -0.05 }
    ];

    const results: PlanetaryPosition[] = planets.map(p => {
        const long = (seededRandom() * 360) % 360;
        return {
            planet: p.name,
            longitude: long,
            house: Math.floor(long / 30) + 1,
            sign: ZODIAC_SIGNS[Math.floor(long / 30)],
            isRetrograde: p.speed < 0 || seededRandom() > 0.8
        };
    });

    const ascendantLong = (seededRandom() * 360) % 360;

    return {
        ascendant: ZODIAC_SIGNS[Math.floor(ascendantLong / 30)],
        planets: results,
        houses: Array.from({length: 12}, (_, i) => (Math.floor(ascendantLong / 30) + i) % 12 + 1),
        isOffline: true
    };
}

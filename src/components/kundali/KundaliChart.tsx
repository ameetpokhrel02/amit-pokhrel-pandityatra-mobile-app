import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.85;

interface Planet {
    planet: string;
    house: number;
    sign: string;
}

interface KundaliChartProps {
    planets: Planet[];
    houses: number[]; // Sign numbers for each house 1-12
    colors: any;
    isDark: boolean;
}

const PLANET_ABBR: {[key: string]: string} = {
    'Sun': 'Su',
    'Moon': 'Mo',
    'Mars': 'Ma',
    'Mercury': 'Me',
    'Jupiter': 'Ju',
    'Venus': 'Ve',
    'Saturn': 'Sa',
    'Rahu': 'Ra',
    'Ketu': 'Ke',
    'Uranus': 'Ur',
    'Neptune': 'Ne',
    'Pluto': 'Pl'
};

const KundaliChart: React.FC<KundaliChartProps> = ({ planets, houses, colors, isDark }) => {
    const strokeColor = isDark ? '#f97316' : '#ea580c';
    const textColor = colors.text;
    const signColor = colors.primary;

    const getPlanetsInHouse = (houseNum: number) => {
        return planets.filter(p => p.house === houseNum).map(p => PLANET_ABBR[p.planet] || p.planet.substring(0, 2));
    };

    // North Indian Chart Coords (Square 0 to 100)
    // House 1: Diamond (50,0 -> 0,50 -> 50,100 -> 100,50) - NO, that's not right.
    // The chart is a square.
    // X lines: (0,0 to 100,100) and (100,0 to 0,100)
    // Inner square: (50,0 to 0,50), (0,50 to 50,100), (50,100 to 100,50), (100,50 to 50,0)
    
    const h = CHART_SIZE;
    
    // Position helpers for text (scaled 0-100)
    const getHousePos = (houseNum: number) => {
        switch(houseNum) {
            case 1: return { x: 50, y: 25 };
            case 2: return { x: 25, y: 12 };
            case 3: return { x: 12, y: 25 };
            case 4: return { x: 25, y: 50 };
            case 5: return { x: 12, y: 75 };
            case 6: return { x: 25, y: 88 };
            case 7: return { x: 50, y: 75 };
            case 8: return { x: 75, y: 88 };
            case 9: return { x: 88, y: 75 };
            case 10: return { x: 75, y: 50 };
            case 11: return { x: 88, y: 25 };
            case 12: return { x: 75, y: 12 };
            default: return { x: 0, y: 0 };
        }
    };

    return (
        <View style={styles.container}>
            <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox="0 0 100 100">
                {/* Border Square */}
                <Path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill="none" stroke={strokeColor} strokeWidth="1" />
                
                {/* Diagonals */}
                <Line x1="0" y1="0" x2="100" y2="100" stroke={strokeColor} strokeWidth="0.8" />
                <Line x1="100" y1="0" x2="0" y2="100" stroke={strokeColor} strokeWidth="0.8" />
                
                {/* Inner Diamond */}
                <Path d="M 50 0 L 0 50 L 50 100 L 100 50 Z" fill="none" stroke={strokeColor} strokeWidth="0.8" />

                {/* House Numbers (Signs) & Planets */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const houseNum = i + 1;
                    const pos = getHousePos(houseNum);
                    const signNum = houses[i] || ((houses[0] + i - 1) % 12 + 1); // Simple logic if houses array is just signs
                    const housePlanets = getPlanetsInHouse(houseNum);

                    return (
                        <G key={houseNum}>
                            {/* Sign Number */}
                            <SvgText 
                                x={pos.x} y={pos.y - 4} 
                                fill={signColor} fontSize="5" fontWeight="bold" textAnchor="middle"
                            >
                                {signNum}
                            </SvgText>
                            
                            {/* Planets Abbreviations */}
                            {housePlanets.map((p, idx) => (
                                <SvgText 
                                    key={idx}
                                    x={pos.x} y={pos.y + 4 + (idx * 5)} 
                                    fill={textColor} fontSize="4.5" textAnchor="middle"
                                >
                                    {p}
                                </SvgText>
                            ))}
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    }
});

export default KundaliChart;

import { Alert, Platform } from 'react-native';

// Defensive imports to prevent crash on startup if native modules aren't linked
let Print: any;
let Sharing: any;

try {
    Print = require('expo-print');
    Sharing = require('expo-sharing');
} catch (e) {
    console.warn('[KundaliPDF] Native modules for PDF are not available. A rebuild is likely required.');
}

interface CustomerData {
    name: string;
    dob: string;
    tob: string;
    place: string;
}

const PLANET_ABBR: {[key: string]: string} = {
    'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me',
    'Jupiter': 'Ju', 'Venus': 'Ve', 'Saturn': 'Sa', 'Rahu': 'Ra', 'Ketu': 'Ke'
};

/**
 * Generates a North Indian Style Kundali Chart SVG as a string for use in HTML
 */
function generateNorthIndianChartSVG(planets: any[], houses: number[]) {
    const strokeColor = '#ea580c';
    const textColor = '#333';
    const signColor = '#f97316';

    const getPlanetsInHouse = (houseNum: number) => {
        return planets.filter(p => p.house === houseNum).map(p => PLANET_ABBR[p.planet] || p.planet.substring(0, 2));
    };

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

    let housesSVG = '';
    const houseList = houses && houses.length === 12 ? houses : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    for (let i = 1; i <= 12; i++) {
        const pos = getHousePos(i);
        const signNum = houseList[i-1];
        const housePlanets = getPlanetsInHouse(i);
        
        housesSVG += `
            <g>
                <text x="${pos.x}" y="${pos.y - 4}" fill="${signColor}" font-size="5" font-weight="bold" text-anchor="middle">${signNum}</text>
                ${housePlanets.map((p, idx) => `
                    <text x="${pos.x}" y="${pos.y + 4 + (idx * 5)}" fill="${textColor}" font-size="4.5" text-anchor="middle">${p}</text>
                `).join('')}
            </g>
        `;
    }

    return `
        <svg width="400" height="400" viewBox="0 0 100 100" style="display: block; margin: 20px auto; border: 1px solid ${strokeColor};">
            <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill="none" stroke="${strokeColor}" stroke-width="1" />
            <line x1="0" y1="0" x2="100" y2="100" stroke="${strokeColor}" stroke-width="0.8" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="${strokeColor}" stroke-width="0.8" />
            <path d="M 50 0 L 0 50 L 50 100 L 100 50 Z" fill="none" stroke="${strokeColor}" stroke-width="0.8" />
            ${housesSVG}
        </svg>
    `;
}

export async function generateKundaliPDF(data: CustomerData, kundali: any) {
    if (!Print || !Sharing || !Print.printToFileAsync) {
        Alert.alert('Module Missing', 'PDF modules not found. Ensure expo-print and expo-sharing are installed.');
        return;
    }

    const { name, dob, tob, place } = data;
    const { ascendant, planets, isOffline, houses } = kundali;
    const chartSVG = generateNorthIndianChartSVG(planets || [], houses || []);

    const planetRows = (planets || []).map((p: any) => `
        <tr>
            <td>${p.planet}</td>
            <td>${p.sign}</td>
            <td>${p.house}</td>
            <td>${typeof p.longitude === 'number' ? p.longitude.toFixed(2) : (p.longitude || '0.00')}°</td>
            <td><span style="color: ${p.isRetrograde ? '#e11d48' : '#059669'}">${p.isRetrograde ? 'Retrograde' : 'Direct'}</span></td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; }
          body { font-family: 'Georgia', serif; color: #1a1a1a; margin: 0; padding: 0; line-height: 1.6; }
          .container { padding: 40px; min-height: 100vh; position: relative; background: #fffcf9; border: 15px solid #ea580c; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(234, 88, 12, 0.03); white-space: nowrap; pointer-events: none; }
          
          .header { text-align: center; margin-bottom: 40px; }
          .om-symbol { font-size: 48px; color: #ea580c; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #ea580c; font-size: 32px; letter-spacing: 2px; }
          .header p { margin: 5px 0; color: #666; font-style: italic; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #fff; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px; }
          .info-item { border-bottom: 1px solid #f9fafb; padding: 8px 0; }
          .info-label { font-size: 11px; color: #9a3412; font-weight: bold; text-transform: uppercase; }
          .info-value { font-size: 15px; font-weight: 500; }
          
          .chart-section { text-align: center; margin-bottom: 40px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .chart-title { font-size: 20px; color: #9a3412; margin-bottom: 20px; border-bottom: 2px solid #ea580c; display: inline-block; padding: 0 20px; }
          
          table { width: 100%; border-collapse: collapse; background: white; margin-top: 20px; font-size: 13px; }
          th { background: #ea580c; color: white; padding: 12px; text-align: left; }
          td { border-bottom: 1px solid #e5e7eb; padding: 12px; }
          tr:nth-child(even) { background: #fff8f1; }
          
          .prediction-box { margin-top: 40px; padding: 24px; background: #fff; border: 2px dashed #fed7aa; border-radius: 12px; }
          .prediction-box h3 { color: #ea580c; margin-top: 0; }
          
          .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">PANDITYATRA SPIRITUAL AI</div>
          
          <div class="header">
            <div class="om-symbol">ॐ</div>
            <h1>Sacred Janampatri</h1>
            <p>Certified Spiritual Birth Chart Report</p>
          </div>

          <div class="info-grid">
            <div class="info-item"><div class="info-label">Name</div><div class="info-value">${name}</div></div>
            <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">${dob}</div></div>
            <div class="info-item"><div class="info-label">Time of Birth</div><div class="info-value">${tob}</div></div>
            <div class="info-item"><div class="info-label">Place of Birth</div><div class="info-value">${place}</div></div>
            <div class="info-item"><div class="info-label">Ascendant</div><div class="info-value">${ascendant || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">Protocol</div><div class="info-value">${isOffline ? 'Offline Engine (v1.0)' : 'Spiritual Cloud AI'}</div></div>
          </div>

          <div class="chart-section">
            <div class="chart-title">Birth Chart (Lagna Kundali)</div>
            ${chartSVG}
          </div>

          <h3>Planetary Degrees & Positions</h3>
          <table>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Sign</th>
                <th>House</th>
                <th>Longitude</th>
                <th>Motion</th>
              </tr>
            </thead>
            <tbody>
              ${planetRows}
            </tbody>
          </table>

          <div class="prediction-box">
             <h3>Divine Guidance</h3>
             <p>Your Lagna (Ascendant) is ${ascendant || 'your sign'}. This indicates a personality with qualities of ${ascendant === 'Aries' ? 'strong will, leadership, and vitality' : 'distinctive spiritual character'}.</p>
             <p>The placement of your planets suggests a balanced path between dharma (duty) and karma (action). For a deeper interpretation, consider booking a personalized session with one of our certified Pandits.</p>
          </div>

          <div class="footer">
            <p>Generated by PanditYatra Digital Spiritual Assistant • ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}</p>
            <p>This report is for spiritual guidance and informational purposes only.</p>
          </div>
        </div>
      </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { 
            UTI: 'com.adobe.pdf', 
            mimeType: 'application/pdf',
            dialogTitle: `Kundali - ${name}`
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
}


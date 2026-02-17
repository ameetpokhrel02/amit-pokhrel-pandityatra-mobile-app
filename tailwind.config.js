/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FF6F00', // Saffron
                    50: '#FFF3E0',
                    100: '#FFE0B2',
                    200: '#FFCC80',
                    300: '#FFB74D',
                    400: '#FFA726',
                    500: '#FF6F00',
                    600: '#FB8C00',
                    700: '#F57C00',
                    800: '#EF6C00',
                    900: '#E65100',
                },
                secondary: {
                    DEFAULT: '#9C1C1C', // Deep Red
                    50: '#FFEBEE',
                    100: '#FFCDD2',
                    200: '#EF9A9A',
                    300: '#E57373',
                    400: '#EF5350',
                    500: '#9C1C1C',
                    600: '#E53935',
                    700: '#D32F2F',
                    800: '#C62828',
                    900: '#B71C1C',
                },
                accent: {
                    DEFAULT: '#FFD700', // Gold
                    50: '#FFFDE7',
                    100: '#FFF9C4',
                    200: '#FFF59D',
                    300: '#FFF176',
                    400: '#FFEE58',
                    500: '#FFD700',
                    600: '#FDD835',
                    700: '#FBC02D',
                    800: '#F9A825',
                    900: '#F57F17',
                },
                background: '#F5F5F5', // Cream/White
                textDark: '#3E2723', // Dark Brown
            },
        },
    },
    plugins: [],
}

import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0078D4',
                    hover: '#106EBE',
                    light: '#E1F5FE',
                },
                secondary: {
                    DEFAULT: '#50E6FF',
                    hover: '#00D4FF',
                    light: '#E0F7FA',
                },
                accent: {
                    DEFAULT: '#FF6B35',
                    hover: '#E55A2B',
                    light: '#FFE8E0',
                },
                surface: {
                    DEFAULT: '#F5F5F5',
                    dark: '#1B1B1B',
                },
                success: '#10A37F',
                warning: '#FFA500',
                error: '#EF4444',
                border: '#E0E0E0',
                'text-primary': '#1B1B1B',
                'text-secondary': '#666666',
                'text-muted': '#999999',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            spacing: {
                '1': '0.25rem',
                '2': '0.5rem',
                '3': '0.75rem',
                '4': '1rem',
                '5': '1.25rem',
                '6': '1.5rem',
                '8': '2rem',
                '10': '2.5rem',
                '12': '3rem',
                '16': '4rem',
            },
            borderRadius: {
                'sm': '0.25rem',
                'md': '0.5rem',
                'lg': '0.75rem',
                'xl': '1rem',
                'full': '9999px',
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;

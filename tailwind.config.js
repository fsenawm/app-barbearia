/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#177ccf",
                'background-light': '#f8fafc',
                'background-dark': '#111a21',
            },
        },
    },
    plugins: [],
}

// Simple script to generate placeholder PNG icons from canvas
// Run with: node generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');

[16, 48, 128].forEach(size => {
  // Create a simple SVG-based icon as a placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#0A66C2"/>
    <text x="${size/2}" y="${size * 0.65}" font-family="Arial" font-weight="bold" font-size="${size * 0.5}" fill="white" text-anchor="middle">W</text>
  </svg>`;
  fs.writeFileSync(`icon${size}.svg`, svg);
});

console.log('SVG icons generated');

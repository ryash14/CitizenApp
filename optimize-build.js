const fs = require('fs');
const path = require('path');

// Optimize package.json for faster builds
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add optimization scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "start:fast": "GENERATE_SOURCEMAP=false react-scripts start",
  "build:fast": "GENERATE_SOURCEMAP=false react-scripts build"
};

// Add performance optimizations
packageJson.browserslist = {
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all"
  ],
  "development": [
    "last 1 chrome version"
  ]
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('✅ Package.json optimized for faster builds');
console.log('🚀 Use "npm run start:fast" for faster development server');
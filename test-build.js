const { exec } = require('child_process');

console.log('🧪 Testing app build...');

exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️ Build warnings:', stderr);
  }
  
  console.log('✅ Build successful!');
  console.log(stdout);
});
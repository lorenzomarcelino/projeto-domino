import { exec } from 'child_process';
import path from 'path';

// Run the build
console.log('Building backend...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }
  console.log(stdout);
  
  // Start the server
  console.log('Starting server...');
  exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Server error: ${error}`);
      return;
    }
    console.log(stdout);
  });
}); 
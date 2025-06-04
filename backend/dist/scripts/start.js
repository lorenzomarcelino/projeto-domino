"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// Run the build
console.log('Building backend...');
(0, child_process_1.exec)('npm run build', (error, stdout, stderr) => {
    if (error) {
        console.error(`Build error: ${error}`);
        return;
    }
    console.log(stdout);
    // Start the server
    console.log('Starting server...');
    (0, child_process_1.exec)('npm start', (error, stdout, stderr) => {
        if (error) {
            console.error(`Server error: ${error}`);
            return;
        }
        console.log(stdout);
    });
});

import { initializeDatabase } from './src/config/dbInit.js';

initializeDatabase()
    .then(() => {
        console.log("Database initialization successful.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
        process.exit(1);
    });

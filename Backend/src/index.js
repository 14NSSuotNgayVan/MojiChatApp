import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`App run on port: http://localhost:${PORT}`)
    })
});

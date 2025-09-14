const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./api-routes/auth');
const userRoutes = require('./api-routes/user');

app.get('/', (req, res) => {
    res.send("Welcome to GreenRoute API");
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

db.authenticate()
    .then(() => {
        console.log('Database connected successfully');
        return db.sync();
    })
    .then(() => {
        console.log('Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Database connection or sync failed', error);
    });
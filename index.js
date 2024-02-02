require('./src/models/User');
require('./src/models/Campaign');
const { config } = require('dotenv');
const { set, connect, connection } = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const uploadRoutes = require('./src/routes/UploadRoutes');
const userRoutes = require('./src/routes/UserRoutes');
const campaignRoutes = require('./src/routes/CampaignRoutes');
config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

set('strictQuery', false);

connect(process.env.MONGODB_URL);

connection.on('connected', () => {
	console.log('Connected to DB.');
});

connection.on('error', (err) => {
	console.log('Error, connecting to DB.', err);
});

app.use(uploadRoutes);
app.use(userRoutes);
app.use(campaignRoutes);

const server = http.createServer(app);

const port = process.env.PORT || 3005;

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

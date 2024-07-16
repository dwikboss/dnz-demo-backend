import 'dotenv/config';
import express from 'express';
import mainRoutes from './routes/main';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:8080', // Allow only your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Load environment variables
require('dotenv').config();

// Routes
app.use('/api', mainRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
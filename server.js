const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/send-message', async (req, res) => {
    const formData = req.body;
    console.log(formData);
    const message = formData.message;
    res.json({ message });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
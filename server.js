const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config(); 
const db = require('./firebase'); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Route to create an order
app.post('/create-order', async (req, res) => {
  const { amount, currency, receipt } = req.body;

  // Validate request body
  if (!amount || !currency || !receipt) {
    return res.status(400).json({ error: 'Amount, currency, and receipt are required' });
  }

  try {
    const options = {
      amount: amount * 100, 
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function toEpochTime() {
  const dt = new Date(); // Current UTC time
  return Math.floor(dt.getTime() / 1000); // Convert to epoch time in seconds
}

app.get('/fetch-credit-report', async (req, res) => {
  try {
    const apiUrl = 'https://eb964186-d3c2-48d5-95a4-895797265b4b.mock.pstmn.io/get';

    const header = {
      alg: "HS256",
      typ: "JWT"
    };
  
    const payload = {
      timestamp: new Date().getTime(), 
      // timestamp: 1724321625757,
      partnerId: "CORP00001490",
      reqid: toEpochTime(), 
      // reqid: "168682"
    };
  
    const secretKey = process.env.JSON_TOKEN_SECRET_KEY; // Use your key or replace
  
    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
  
    // Generate the signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '');
  
    // Combine to form the JWT
    const token = `${signatureInput}.${signature}`;

    // API headers
    const headers = {
      token: token,
      accept: 'application/json',
      authorisedkey: "",
      'content-type': 'application/json',
      'User-Agent': ""
    };

    const response = await axios.get(apiUrl, {}, { headers });
    console.log('API response:', response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling third-party API:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data,
        message: error.message
      });
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
});

app.post('/save-customer-details', async(req, res) => {
  const customerDetails = req.body; 
  
  try {
    const docRef = db.collection('Users').doc(customerDetails.body.mobile); 
    await docRef.set(customerDetails); 
    console.log("Check this: ",customerDetails);
    res.status(200).send({ message: 'Document created successfully' });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).send({ error: 'Failed to create document' });
  }
});

app.post('/save-report-json', (req, res) => {
  const newData = req.body; 

  // Path to your JSON file
  const filePath = './one.json';

  // Write the new data to the file
  fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error writing file', error: err });
    }
    res.status(200).json({ message: 'File replaced successfully', data: newData });
  });
});

app.get('/get-report-json', (req, res) => {
  fs.readFile('one.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
          return res.status(500).json({ error: 'Failed to load credit report' });
      }
      res.json(JSON.parse(data));
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));


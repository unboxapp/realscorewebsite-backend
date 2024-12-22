const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables

// Validate environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay key_id and key_secret must be set in .env file');
}

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
      amount: amount * 100, // Amount in smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
    //if(payment successful)
    //then call Credit report API
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment verification route (optional)
app.post('/verify-payment', async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  try {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    if (hash === signature) {
      res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error verifying payment' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

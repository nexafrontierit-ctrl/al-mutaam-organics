const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

const ADMIN_PASSWORD = 'mutaam786';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 1. Naya Order Save Karna
app.post('/api/orders', upload.single('screenshot'), (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  const orderId = 'AMO-' + Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: Date.now().toString(),
    orderId,
    customerName: req.body.customerName,
    phone: req.body.phone,
    area: req.body.area,
    address: req.body.address,
    quantity: Number(req.body.quantity),
    deliveryFee: Number(req.body.deliveryFee),
    totalAmount: Number(req.body.totalAmount),
    paymentMethod: req.body.paymentMethod,
    screenshot: req.file ? '/uploads/' + req.file.filename : '',
    status: 'Pending',
    createdAt: new Date().toLocaleString()
  };
  orders.unshift(newOrder);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  res.json({ success: true, orderId });
});

// 2. Order Track Karna
app.get('/api/orders/track/:orderId', (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  const order = orders.find(o => o.orderId === req.params.orderId.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Order nahi mila' });
  res.json({ success: true, order });
});

// 3. Admin Orders Dekhna
app.get('/api/admin/orders', (req, res) => {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Ghalat Password' });
  }
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  res.json({ success: true, orders });
});

// 4. Admin Status Update Karna
app.put('/api/admin/orders/:id', (req, res) => {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false });
  }
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index !== -1) {
    orders[index].status = req.body.status;
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  }
  res.json({ success: true });
});

app.listen(5000, () => console.log('Al Mutaam Organics Server running on http://localhost:5000'));

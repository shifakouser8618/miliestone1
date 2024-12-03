const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
let menuItems = [];
let orders = [];
app.post('/menu', (req, res) => {
    const { name, price, category } = req.body;
    if (price <= 0 || !['appetizer', 'main', 'dessert', 'beverage'].includes(category)) {
        return res.status(400).send('Invalid menu item data.');
    }
    const itemId = menuItems.length + 1;
    menuItems.push({ id: itemId, name, price, category });
    res.status(201).json({ id: itemId, name, price, category });
});
app.get('/menu', (req, res) => {
    res.json(menuItems);
});
app.post('/orders', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.some(itemId => !menuItems.find(item => item.id === itemId))) {
        return res.status(400).send('Invalid order request.');
    }
    const orderId = orders.length + 1;
    orders.push({ id: orderId, items, status: 'Preparing' });
    res.status(201).json({ id: orderId });
});
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        return res.status(404).send('Order not found.');
    }
    res.json(order);
});
// Update Menu Item
app.put('/menu/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const { name, price, category } = req.body;

    // Find the index of the menu item to update
    const itemIndex = menuItems.findIndex(item => item.id === itemId);

    // Check if the item exists
    if (itemIndex === -1) {
        return res.status(404).send('Menu item not found.');
    }

    // Validate input
    if (price <= 0 || !['appetizer', 'main', 'dessert', 'beverage'].includes(category)) {
        return res.status(400).send('Invalid menu item data.');
    }

    // Update the menu item
    menuItems[itemIndex] = { id: itemId, name, price, category };
    res.json(menuItems[itemIndex]);
});
cron.schedule('* * * * *', () => { // Runs every minute
    orders.forEach(order => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });
});
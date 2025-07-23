// --- ES Module Imports ---
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Booking from '../server/models/Booking.js'; // Import Booking model from main server
import User from '../server/models/User.js'; // Import User model for population
import Ground from '../server/models/Ground.js'; // Import Ground model for population
import Location from '../server/models/Location.js'; // Import Location model for location endpoints
import bcrypt from 'bcryptjs';

// --- Fix for __dirname in ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CONFIG ---
const MONGO_URI = 'mongodb+srv://rag123456:rag123456@cluster0.qipvo.mongodb.net/boxcricket?retryWrites=true&w=majority'; // Atlas URI, using boxcricket DB
const JWT_SECRET = 'adminpanel_secret';

// --- EXPRESS APP ---
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Admin Auth Middleware ---
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('Not admin');
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// --- Admin Login (hardcoded) ---
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@boxcric.com' && password === 'admin123') {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// --- Grounds CRUD ---
app.get('/api/admin/grounds', adminAuth, async (req, res) => {
  const grounds = await Ground.find();
  // For each ground, fetch the owner's password from the User model
  const groundsWithPasswords = await Promise.all(grounds.map(async (ground) => {
    let ownerPassword = '';
    if (ground.owner && ground.owner.userId) {
      const user = await User.findById(ground.owner.userId).lean();
      if (user && user.password) {
        ownerPassword = user.password; // INSECURE: plain text or hashed
      }
    }
    return {
      ...ground.toObject(),
      owner: {
        ...ground.owner,
        password: ownerPassword
      }
    };
  }));
  res.json(groundsWithPasswords);
});

app.post('/api/admin/grounds', adminAuth, async (req, res) => {
  try {
    // Validate cityId
    const city = await Location.findOne({ id: req.body.location.cityId });
    if (!city) return res.status(400).json({ message: 'Invalid cityId' });
    req.body.location = {
      cityId: city.id,
      cityName: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      address: req.body.location.address,
      pincode: req.body.location.pincode
    };

    // Create or update owner in User model
    let user = await User.findOne({ email: req.body.owner.email });
    if (!user) {
      user = await User.create({
        name: req.body.owner.name,
        email: req.body.owner.email,
        phone: req.body.owner.contact,
        password: req.body.owner.password,
        role: 'ground_owner',
        isVerified: true
      });
    } else {
      user.name = req.body.owner.name;
      user.phone = req.body.owner.contact;
      if (req.body.owner.password) user.password = req.body.owner.password;
      user.isVerified = true;
      await user.save();
    }

    // Set userId in ground owner
    const groundData = {
      ...req.body,
      status: "active",
      isVerified: true,
      owner: {
        ...req.body.owner,
        userId: user._id,
      },
      availability: req.body.availability || {
        timeSlots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"],
        blockedDates: [],
        weeklySchedule: {
          monday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          tuesday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          wednesday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          thursday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          friday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          saturday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] },
          sunday: { isOpen: true, slots: ["06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"] }
        }
      }
    };

    const ground = await Ground.create(groundData);
    res.json(ground);
  } catch (err) {
    console.error('Error creating ground:', err);
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/admin/grounds/:id', adminAuth, async (req, res) => {
  try {
    // Validate cityId
    const city = await Location.findOne({ id: req.body.location.cityId });
    if (!city) return res.status(400).json({ message: 'Invalid cityId' });
    req.body.location.cityName = city.name;
    req.body.location.state = city.state;
    req.body.location.latitude = city.latitude;
    req.body.location.longitude = city.longitude;

    // Update owner password if provided
    if (req.body.owner && req.body.owner.password) {
      let user = null;
      if (req.body.owner.userId && req.body.owner.userId !== 'undefined' && req.body.owner.userId !== '') {
        user = await User.findById(req.body.owner.userId);
      }
      if (!user && req.body.owner.email) {
        user = await User.findOne({ email: req.body.owner.email });
      }
      if (user) {
        user.password = req.body.owner.password; // Save as plain text
        await user.save();
      }
      // Remove password from owner object before updating ground
      delete req.body.owner.password;
      delete req.body.owner.userId;
    }

    const ground = await Ground.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ground);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/admin/grounds/:id', adminAuth, async (req, res) => {
  await Ground.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- Location CRUD Endpoints ---
app.get('/api/admin/locations', adminAuth, async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

app.post('/api/admin/locations', adminAuth, async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/admin/locations/:id', adminAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/admin/locations/:id', adminAuth, async (req, res) => {
  await Location.findOneAndDelete({ id: req.params.id });
  res.json({ success: true });
});

// --- Admin: Get All Bookings (with user and ground names) ---
app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name')
      .populate('groundId', 'name');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
  }
});

// --- Admin: Update Booking Status ---
app.patch('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'name')
      .populate('groundId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update booking', error: err.message });
  }
});

// --- Admin: Delete Booking ---
app.delete('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const result = await Booking.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete booking', error: err.message });
  }
});

// --- Full Indian Cities List (copy from user panel) ---
const indianCities = [
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777, popular: true },
  { id: "delhi", name: "Delhi", state: "Delhi", latitude: 28.7041, longitude: 77.1025, popular: true },
  { id: "bangalore", name: "Bangalore", state: "Karnataka", latitude: 12.9716, longitude: 77.5946, popular: true },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867, popular: true },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707, popular: true },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", latitude: 22.5726, longitude: 88.3639, popular: true },
  { id: "pune", name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567, popular: true },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714, popular: true },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", latitude: 26.9124, longitude: 75.7873, popular: false },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462, popular: false },
  { id: "kanpur", name: "Kanpur", state: "Uttar Pradesh", latitude: 26.4499, longitude: 80.3319, popular: false },
  { id: "nagpur", name: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882, popular: false },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", latitude: 22.7196, longitude: 75.8577, popular: false },
  { id: "thane", name: "Thane", state: "Maharashtra", latitude: 19.2183, longitude: 72.9781, popular: false },
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh", latitude: 23.2599, longitude: 77.4126, popular: false },
  { id: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", latitude: 17.6868, longitude: 83.2185, popular: false },
  { id: "patna", name: "Patna", state: "Bihar", latitude: 25.5941, longitude: 85.1376, popular: false },
  { id: "vadodara", name: "Vadodara", state: "Gujarat", latitude: 22.3072, longitude: 73.1812, popular: false },
  { id: "ghaziabad", name: "Ghaziabad", state: "Uttar Pradesh", latitude: 28.6692, longitude: 77.4538, popular: false },
  { id: "ludhiana", name: "Ludhiana", state: "Punjab", latitude: 30.9010, longitude: 75.8573, popular: false },
];

// --- Auto-populate locations if empty ---
async function autoPopulateCities() {
  const count = await Location.countDocuments();
  if (count === 0) {
    await Location.insertMany(indianCities);
    console.log('✅ Indian cities auto-populated in locations collection');
  }
}

// --- Start Server ---
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await autoPopulateCities();
    app.listen(4000, () => {
      console.log('✅ Admin panel running at http://localhost:4000');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

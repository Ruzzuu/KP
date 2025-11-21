// ===================================
// 🚀 PERGUNU EXPRESS.JS API SERVER
// ===================================
// Backend API using Express.js for Vercel deployment
// Replaces json-server with custom Express endpoints

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB, getDB } from './mongodb.js';

// Initialize Express app
const app = express();

// Store SSE clients
const sseClients = new Set();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Server configuration
const PORT = process.env.PORT || 3001;

// Helper function to broadcast to all SSE clients
const broadcastToClients = (event, data) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      // Remove dead connections - log error for debugging
      console.error('SSE client write error:', error.message);
      sseClients.delete(client);
    }
  });
};

// ===== MIDDLEWARE =====
// Secure CORS configuration with environment-based origins
const corsOptions = {
  origin: (origin, callback) => {
    // Log for debugging
    console.log('🔍 CORS check - Origin:', origin, 'NODE_ENV:', process.env.NODE_ENV);
    
    // Get allowed origins from environment
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    
    // Allow same-origin requests (no origin header) - CRITICAL for Vercel
    if (!origin) {
      console.log('✅ CORS: Allowing same-origin request (no origin header)');
      return callback(null, true);
    }
    
    try {
      const url = new URL(origin);
      
      // In development, allow localhost origins
      if (process.env.NODE_ENV !== 'production') {
        const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        if (isLocalhost) {
          console.log('✅ CORS: Allowing localhost origin');
          return callback(null, true);
        }
      }
      
      // Check against whitelist of allowed origins
      const allowList = new Set([
        ...allowedOrigins,
        process.env.FRONTEND_URL,
        'https://kp-mocha.vercel.app', // Production Vercel domain
        'https://kp-git-main-fairuzs-projects-d3e0b8cf.vercel.app', // Git deployment domain
        'https://kp-ue5wmj0ed-fairuzs-projects-d3e0b8cf.vercel.app' // Preview deployment domain
      ].filter(Boolean));
      
      console.log('🔍 CORS allowList:', Array.from(allowList));
      
      if (allowList.has(origin)) {
        console.log('✅ CORS: Origin in allowlist');
        return callback(null, true);
      }
      
      // In production, be more permissive with Vercel preview URLs
      if (origin.includes('vercel.app')) {
        console.log('✅ CORS: Allowing Vercel domain');
        return callback(null, true);
      }
      
      // Log rejected origins for debugging
      console.warn(`❌ CORS: Rejected origin ${origin}`);
      
    } catch (error) {
      console.error('❌ CORS: Invalid origin URL:', error.message);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Support legacy browsers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // ✅ Added PATCH
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'expires', 'cache-control', 'x-requested-with'],
  maxAge: 86400 // Cache preflight for 24 hours
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== SSE ENDPOINT =====
app.get('/api/news/events', (req, res) => {
  console.log('🔔 New SSE client connected');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Add client to the set
  sseClients.add(res);

  // Send initial connection message
  res.write(`event: connected\ndata: {"message": "SSE connection established"}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔔 SSE client disconnected');
    sseClients.delete(res);
  });
});

// ===== DATABASE FUNCTIONS =====
// MongoDB connection state
let useMongoDB = false;

// Initialize MongoDB connection
(async () => {
  try {
    const db = await connectDB();
    if (db) {
      useMongoDB = true;
      console.log('🍃 Using MongoDB for persistent storage');
    } else {
      console.log('📄 Using JSON file for storage');
    }
  } catch (error) {
    console.log('📄 MongoDB not available, using JSON file');
  }
})();

// Use /tmp in Vercel production (writable), local path in dev
const isVercel = process.env.VERCEL === '1';
const DB_SOURCE = join(__dirname, 'db.json');
const DB_PATH = isVercel ? '/tmp/db.json' : DB_SOURCE;

// Helper: Get collection from MongoDB or JSON
const getCollection = async (collectionName) => {
  if (useMongoDB) {
    const db = getDB();
    if (db) {
      return await db.collection(collectionName).find({}).toArray();
    }
  }
  // Fallback to JSON
  const data = readDB();
  return data[collectionName] || [];
};

// Helper: Save collection to MongoDB or JSON
const saveCollection = async (collectionName, items) => {
  if (useMongoDB) {
    const db = getDB();
    if (db) {
      await db.collection(collectionName).deleteMany({});
      if (items.length > 0) {
        await db.collection(collectionName).insertMany(items);
      }
      return;
    }
  }
  // Fallback to JSON
  const data = readDB();
  data[collectionName] = items;
  writeDB(data);
};

// Read database (JSON fallback)
const readDB = () => {
  try {
    console.log('🔍 Attempting to read database from:', DB_PATH);
    console.log('🔍 Vercel environment:', isVercel);
    
    // In Vercel, copy source db.json to /tmp on first run
    if (isVercel && !existsSync(DB_PATH) && existsSync(DB_SOURCE)) {
      console.log('📋 Copying source db.json to /tmp for Vercel...');
      const sourceData = readFileSync(DB_SOURCE, 'utf8');
      writeFileSync(DB_PATH, sourceData);
    }
    
    if (!existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      // Create default db structure if file doesn't exist
      const defaultDB = {
        users: [],
        news: [],
        sessions: [],
        applications: []
      };
      writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }
    
    const data = readFileSync(DB_PATH, 'utf8');
    console.log('✅ Database read successfully, size:', data.length, 'characters');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Database read error:', error.message);
    return { users: [], news: [], sessions: [], applications: [] };
  }
};

// Write database (JSON fallback)
const writeDB = (data) => {
  try {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log('✅ Database written successfully');
    return true;
  } catch (error) {
    console.error('❌ Database write error:', error.message);
    return false;
  }
};

// ===== NEWS ENDPOINTS =====

// GET /api/news - Get all news
app.get('/api/news', async (req, res) => {
  try {
    const news = await getCollection('news');
    console.log('📰 Returning', news.length, 'news items');
    res.json(news || []);
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ error: 'Failed to get news' });
  }
});

// GET /api/news/:id - Get news by ID
app.get('/api/news/:id', async (req, res) => {
  try {
    const news = await getCollection('news');
    const item = news.find(n => n.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ error: 'Failed to get news' });
  }
});

// POST /api/news - Create new news
app.post('/api/news', async (req, res) => {
  try {
    const news = await getCollection('news');
    
    // Get image path from request body (uploaded via file-server)
    const imagePath = req.body.image || null;
    
    const newNews = {
      id: Date.now().toString(),
      title: req.body.title,
      content: req.body.content,
      author: req.body.author || '',
      category: req.body.category || 'general',
      image: imagePath,
      featured: req.body.featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📰 Creating new news:', {
      title: newNews.title,
      hasImage: !!imagePath,
      imagePath: imagePath
    });
    
    news.push(newNews);
    await saveCollection('news', news);
    broadcastToClients('news-added', newNews);
    res.status(201).json(newNews);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news: ' + error.message });
  }
});

// PUT /api/news/:id - Update news
app.put('/api/news/:id', async (req, res) => {
  try {
    const news = await getCollection('news');
    const newsIndex = news.findIndex(n => n.id === req.params.id);
    
    if (newsIndex === -1) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    // Get image path from request body (uploaded via file-server) or keep existing
    let imagePath = news[newsIndex].image; // Keep existing image by default
    
    if (req.body.image !== undefined) {
      // Image field provided in JSON (could be null to remove image, or filename from file-server)
      imagePath = req.body.image;
    }
    
    const updatedNews = {
      ...news[newsIndex],
      title: req.body.title || news[newsIndex].title,
      content: req.body.content || news[newsIndex].content,
      author: req.body.author !== undefined ? req.body.author : news[newsIndex].author,
      category: req.body.category || news[newsIndex].category,
      image: imagePath,
      featured: req.body.featured !== undefined ? req.body.featured : news[newsIndex].featured,
      updatedAt: new Date().toISOString()
    };
    
    console.log('📰 Updating news:', {
      id: req.params.id,
      title: updatedNews.title,
      hasNewImage: !!req.file,
      imagePath: imagePath
    });
    
    news[newsIndex] = updatedNews;
    await saveCollection('news', news);
    broadcastToClients('news-updated', updatedNews);
    res.json(updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news: ' + error.message });
  }
});

// DELETE /api/news/:id - Delete news
app.delete('/api/news/:id', async (req, res) => {
  try {
    const news = await getCollection('news');
    const newsIndex = news.findIndex(n => n.id === req.params.id);
    
    if (newsIndex === -1) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    const deletedNews = news[newsIndex];
    news.splice(newsIndex, 1);
    await saveCollection('news', news);
    broadcastToClients('news-deleted', { id: req.params.id });
    res.json({ message: 'News deleted successfully', deletedNews });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// PUT /api/news/:id/feature - Set featured status
app.put('/api/news/:id/feature', (req, res) => {
  const db = readDB();
  const newsIndex = db.news.findIndex(n => n.id === req.params.id);
  
  if (newsIndex === -1) {
    return res.status(404).json({ error: 'News not found' });
  }

  // Jika akan set featured true, maka reset yang lain menjadi false
  if (req.body.featured === true) {
    db.news.forEach((news, index) => {
      if (index !== newsIndex) {
        news.featured = false;
      }
    });
  }
  
  db.news[newsIndex].featured = req.body.featured;
  db.news[newsIndex].updatedAt = new Date().toISOString();
  
  if (writeDB(db)) {
    broadcastToClients('news-featured', db.news[newsIndex]);
    res.json(db.news[newsIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// ===== USER ENDPOINTS =====

// POST /api/register - User registration
app.post('/api/register', async (req, res) => {
  const db = readDB();
  const { email, password, fullName } = req.body;
  
  // Check if user already exists
  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    fullName,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  
  if (writeDB(db)) {
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } else {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/login - User login (email only)
app.post('/api/login', async (req, res) => {
  const db = readDB();
  const { email, password } = req.body;
  
  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create session
  const sessionId = Date.now().toString() + Math.random().toString(36);
  const session = {
    id: sessionId,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  if (!db.sessions) db.sessions = [];
  db.sessions.push(session);
  writeDB(db);
  
  const { password: _pwd, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, sessionId });
});

// ===== AUTH ENDPOINTS =====

// POST /api/auth/login - User login (username or email)
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  const db = readDB();
  const { username, password } = req.body;
  
  // Find user by username or email
  const user = db.users.find(u => 
    u.username === username || 
    u.email === username
  );
  
  if (!user) {
    console.log('❌ User not found:', username);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('👤 Found user:', user.username, 'Email:', user.email);
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    console.log('❌ Invalid password for user:', user.username);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('✅ Password valid for user:', user.username);
  
  // Create session
  const sessionId = Date.now().toString() + Math.random().toString(36);
  const session = {
    id: sessionId,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  if (!db.sessions) db.sessions = [];
  db.sessions.push(session);
  writeDB(db);
  
  const { password: _pwd, ...userWithoutPassword } = user;
  res.json({ 
    success: true,
    user: userWithoutPassword, 
    token: sessionId,
    message: `Welcome back, ${user.fullName}!`
  });
});

// POST /api/auth/register - User registration
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Registration attempt:', req.body);
  const db = readDB();
  const { email, password, fullName, username } = req.body;
  
  // NEW LOGIC: Block registration if email already exists (no update allowed)
  const registeredEmailCheck = db.users.find(u => u.email === email);
  if (registeredEmailCheck) {
    console.log('❌ Registration blocked: Email already registered:', email);
    return res.status(409).json({ 
      error: 'Email already registered',
      message: 'This email is already in use. Please use a different email address.',
      type: 'EMAIL_ALREADY_EXISTS'
    });
  }
  
  // Check if USERNAME already exists (different from email check)
  const existingUserByUsername = db.users.find(u => u.username === username);
  if (existingUserByUsername) {
    // Username conflict - let frontend retry with different username
    return res.status(409).json({ 
      error: 'Username already exists',
      existingUser: {
        id: existingUserByUsername.id,
        email: existingUserByUsername.email,
        username: existingUserByUsername.username,
        fullName: existingUserByUsername.fullName
      }
    });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    role: 'user',
    certificates: [],
    downloads: 0,
    lastDownload: null,
    downloadHistory: [],
    profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0F7536&color=fff`
  };
  
  db.users.push(newUser);
  const success = writeDB(db);
  
  if (success) {
    const { password: _pwd, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      message: 'User registered successfully'
    });
  } else {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ===== BEASISWA ENDPOINTS =====
// Function untuk menghitung status otomatis berdasarkan tanggal
const calculateBeasiswaStatus = (tanggal_mulai, deadline) => {
  const now = new Date();
  const startDate = new Date(tanggal_mulai);
  const endDate = new Date(deadline);
  
  if (now < startDate) {
    return 'Segera'; // Belum dimulai
  } else if (now >= startDate && now <= endDate) {
    return 'Buka'; // Sedang berlangsung
  } else {
    return 'Tutup'; // Sudah berakhir
  }
};

// GET /api/beasiswa - Get all beasiswa with auto-calculated status
app.get('/api/beasiswa', (req, res) => {
  const db = readDB();
  
  // Update status otomatis untuk semua beasiswa
  const beasiswaWithStatus = (db.beasiswa || []).map(beasiswa => ({
    ...beasiswa,
    status: calculateBeasiswaStatus(beasiswa.tanggal_mulai, beasiswa.deadline)
  }));
  
  console.log('🎓 Returning', beasiswaWithStatus.length, 'beasiswa items');
  res.json(beasiswaWithStatus);
});

// GET /api/beasiswa/:id - Get beasiswa by ID with auto-calculated status
app.get('/api/beasiswa/:id', (req, res) => {
  const db = readDB();
  const beasiswa = (db.beasiswa || []).find(b => b.id === req.params.id);
  
  if (!beasiswa) {
    return res.status(404).json({ error: 'Beasiswa not found' });
  }
  
  // Update status otomatis
  const beasiswaWithStatus = {
    ...beasiswa,
    status: calculateBeasiswaStatus(beasiswa.tanggal_mulai, beasiswa.deadline)
  };
  
  res.json(beasiswaWithStatus);
});

// POST /api/beasiswa - Create new beasiswa
app.post('/api/beasiswa', (req, res) => {
  const db = readDB();
  
  // Validate required fields
  const requiredFields = ['judul', 'nominal', 'deadline', 'tanggal_mulai', 'deskripsi', 'persyaratan', 'kategori'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Field ${field} is required` });
    }
  }
  
  const newBeasiswa = {
    id: Date.now().toString(),
    judul: req.body.judul,
    nominal: req.body.nominal,
    deadline: req.body.deadline,
    tanggal_mulai: req.body.tanggal_mulai,
    status: calculateBeasiswaStatus(req.body.tanggal_mulai, req.body.deadline), // Auto-calculate
    deskripsi: req.body.deskripsi,
    persyaratan: Array.isArray(req.body.persyaratan) ? req.body.persyaratan : [req.body.persyaratan],
    kategori: req.body.kategori,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Initialize beasiswa array if not exists
  if (!db.beasiswa) {
    db.beasiswa = [];
  }
  
  db.beasiswa.push(newBeasiswa);
  
  if (writeDB(db)) {
    broadcastToClients('beasiswa-added', newBeasiswa);
    res.status(201).json(newBeasiswa);
  } else {
    res.status(500).json({ error: 'Failed to save beasiswa' });
  }
});

// PUT /api/beasiswa/:id - Update beasiswa
app.put('/api/beasiswa/:id', (req, res) => {
  const db = readDB();
  const beasiswaIndex = (db.beasiswa || []).findIndex(b => b.id === req.params.id);
  
  if (beasiswaIndex === -1) {
    return res.status(404).json({ error: 'Beasiswa not found' });
  }
  
  const updatedBeasiswa = {
    ...db.beasiswa[beasiswaIndex],
    ...req.body,
    // Auto-calculate status jika tanggal diubah
    status: calculateBeasiswaStatus(
      req.body.tanggal_mulai || db.beasiswa[beasiswaIndex].tanggal_mulai,
      req.body.deadline || db.beasiswa[beasiswaIndex].deadline
    ),
    updatedAt: new Date().toISOString()
  };
  
  db.beasiswa[beasiswaIndex] = updatedBeasiswa;
  
  if (writeDB(db)) {
    broadcastToClients('beasiswa-updated', updatedBeasiswa);
    res.json(updatedBeasiswa);
  } else {
    res.status(500).json({ error: 'Failed to update beasiswa' });
  }
});

// DELETE /api/beasiswa/:id - Delete beasiswa
app.delete('/api/beasiswa/:id', (req, res) => {
  const db = readDB();
  const beasiswaIndex = (db.beasiswa || []).findIndex(b => b.id === req.params.id);
  
  if (beasiswaIndex === -1) {
    return res.status(404).json({ error: 'Beasiswa not found' });
  }
  
  const deletedBeasiswa = db.beasiswa[beasiswaIndex];
  db.beasiswa.splice(beasiswaIndex, 1);
  
  if (writeDB(db)) {
    broadcastToClients('beasiswa-deleted', { id: req.params.id });
    res.status(204).send(); // No content response for successful deletion
  } else {
    res.status(500).json({ error: 'Failed to delete beasiswa' });
  }
});

// GET /api/beasiswa/kategori/:kategori - Get beasiswa by kategori
app.get('/api/beasiswa/kategori/:kategori', (req, res) => {
  const db = readDB();
  const kategori = req.params.kategori;
  
  let filteredBeasiswa = db.beasiswa || [];
  
  // Filter by kategori (case insensitive), kecuali "Semua Program"
  if (kategori !== 'Semua Program') {
    filteredBeasiswa = filteredBeasiswa.filter(b => 
      b.kategori.toLowerCase() === kategori.toLowerCase()
    );
  }
  
  // Update status otomatis untuk semua hasil
  const beasiswaWithStatus = filteredBeasiswa.map(beasiswa => ({
    ...beasiswa,
    status: calculateBeasiswaStatus(beasiswa.tanggal_mulai, beasiswa.deadline)
  }));
  
  console.log('🎓 Returning', beasiswaWithStatus.length, 'beasiswa items for kategori:', kategori);
  res.json(beasiswaWithStatus);
});

// ===== BEASISWA APPLICATION ENDPOINTS =====
// POST /api/beasiswa-applications - Submit beasiswa application
app.post('/api/beasiswa-applications', (req, res) => {
  const db = readDB();
  
  // Validate required fields for beasiswa application
  const requiredFields = ['beasiswaId', 'beasiswaTitle', 'fullName', 'email', 'phone'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Field ${field} is required` });
    }
  }
  
  const newApplication = {
    id: Date.now().toString(),
    beasiswaId: req.body.beasiswaId,
    beasiswaTitle: req.body.beasiswaTitle,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    education: req.body.education || '',
    gpa: req.body.gpa || '',
    motivation: req.body.motivation || '',
    status: 'pending',
    submittedAt: req.body.submittedAt || new Date().toISOString(),
    processedAt: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Initialize beasiswa_applications array if not exists
  if (!db.beasiswa_applications) {
    db.beasiswa_applications = [];
  }
  
  db.beasiswa_applications.push(newApplication);
  
  if (writeDB(db)) {
    broadcastToClients('beasiswa-application-added', newApplication);
    res.status(201).json({
      message: 'Pendaftaran beasiswa berhasil dikirim',
      application: newApplication
    });
  } else {
    res.status(500).json({ error: 'Failed to save beasiswa application' });
  }
});

// GET /api/beasiswa-applications - Get all beasiswa applications (admin only)
app.get('/api/beasiswa-applications', (req, res) => {
  const db = readDB();
  res.json(db.beasiswa_applications || []);
});

// GET /api/beasiswa-applications/user/:email - Get applications by user email
app.get('/api/beasiswa-applications/user/:email', (req, res) => {
  const db = readDB();
  const userApplications = (db.beasiswa_applications || []).filter(app => app.email === req.params.email);
  res.json(userApplications);
});

// PUT /api/beasiswa-applications/:id/status - Update application status
app.put('/api/beasiswa-applications/:id/status', (req, res) => {
  const db = readDB();
  const appIndex = (db.beasiswa_applications || []).findIndex(app => app.id === req.params.id);
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Beasiswa application not found' });
  }
  
  db.beasiswa_applications[appIndex].status = req.body.status;
  db.beasiswa_applications[appIndex].processedAt = new Date().toISOString();
  db.beasiswa_applications[appIndex].notes = req.body.notes || '';
  db.beasiswa_applications[appIndex].updatedAt = new Date().toISOString();
  
  if (writeDB(db)) {
    broadcastToClients('beasiswa-application-updated', db.beasiswa_applications[appIndex]);
    res.json(db.beasiswa_applications[appIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update beasiswa application status' });
  }
});

// ===== APPLICATION ENDPOINTS =====

// POST /api/applications - Submit application
app.post('/api/applications', (req, res) => {
  const db = readDB();
  
  const newApplication = {
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (!db.applications) db.applications = [];
  db.applications.push(newApplication);
  
  if (writeDB(db)) {
    res.status(201).json(newApplication);
  } else {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/applications - Get all applications (admin only)
app.get('/api/applications', (req, res) => {
  const db = readDB();
  res.json(db.applications || []);
});

// GET /api/applications/user/:userId - Get applications by user
app.get('/api/applications/user/:userId', (req, res) => {
  const db = readDB();
  const userApplications = (db.applications || []).filter(app => app.userId === req.params.userId);
  res.json(userApplications);
});

// PUT /api/applications/:id/status - Update application status
app.put('/api/applications/:id/status', (req, res) => {
  const db = readDB();
  const appIndex = db.applications.findIndex(app => app.id === req.params.id);
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  db.applications[appIndex].status = req.body.status;
  db.applications[appIndex].updatedAt = new Date().toISOString();
  
  if (writeDB(db)) {
    res.json(db.applications[appIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// DELETE /api/applications/:id - Delete application (remove from history)
app.delete('/api/applications/:id', (req, res) => {
  const db = readDB();
  const appIndex = db.applications.findIndex(app => app.id === req.params.id);
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Remove application from array
  db.applications.splice(appIndex, 1);
  
  if (writeDB(db)) {
    console.log(`🗑️ Application ${req.params.id} deleted successfully`);
    res.json({ success: true, message: 'Application deleted' });
  } else {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// PATCH /api/applications/:id - Update application (for approve/reject with notes)
app.patch('/api/applications/:id', (req, res) => {
  const db = readDB();
  const appIndex = db.applications.findIndex(app => app.id === req.params.id);
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // Update application with new data
  const updatedApp = {
    ...db.applications[appIndex],
    ...req.body,
    processedAt: new Date().toISOString()
  };
  
  db.applications[appIndex] = updatedApp;
  
  if (writeDB(db)) {
    console.log(`✅ Application ${req.params.id} updated:`, req.body.status || 'data updated');
    
    // Broadcast real-time update
    broadcastToClients('application-updated', updatedApp);
    
    res.json(updatedApp);
  } else {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// ===== STATUS CHECK ENDPOINT =====
// GET /api/check-status/:email - Check application status by email (public endpoint)
app.get('/api/check-status/:email', (req, res) => {
  const db = readDB();
  const email = decodeURIComponent(req.params.email).toLowerCase().trim();
  
  console.log(`🔍 Checking application status for email: ${email}`);
  
  // Search for application by email (case-insensitive)
  const application = (db.applications || []).find(
    app => app.email && app.email.toLowerCase().trim() === email
  );
  
  if (!application) {
    console.log(`❌ No application found for email: ${email}`);
    return res.json({
      success: false,
      message: 'Email tidak terdaftar dalam sistem',
      application: null
    });
  }
  
  // Generate status message based on application status
  let statusMessage = '';
  switch (application.status) {
    case 'pending':
      statusMessage = 'Pendaftaran Anda sedang diproses oleh admin. Harap tunggu maksimal 2x24 jam untuk konfirmasi.';
      break;
    case 'approved':
      statusMessage = 'Selamat! Pendaftaran Anda telah disetujui. Silakan cek email untuk username dan password login.';
      break;
    case 'rejected':
      statusMessage = 'Pendaftaran Anda perlu diperbaiki. Silakan cek email untuk detail dan daftar ulang dengan data yang benar.';
      break;
    default:
      statusMessage = 'Status pendaftaran Anda sedang dalam review.';
  }
  
  console.log(`✅ Application found - Status: ${application.status}`);
  
  res.json({
    success: true,
    message: statusMessage,
    application: {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      position: application.position || 'N/A',
      school: application.school || 'N/A',
      status: application.status,
      submittedAt: application.submittedAt,
      processedAt: application.processedAt || null,
      notes: application.notes || '',
      // Hide sensitive data
      credentials: undefined,
      pw: undefined,
      pc: undefined
    }
  });
});

// ===== USER MANAGEMENT ENDPOINTS =====

// GET /api/users - Get all users (for admin dashboard)
app.get('/api/users', (req, res) => {
  const db = readDB();
  console.log('👥 Returning', db.users.length, 'users');
  
  // Remove passwords from response
  const usersWithoutPasswords = db.users.map(user => {
    const { password: _pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json(usersWithoutPasswords);
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove password from response
  const { password: _pwd, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', async (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updatedUser = {
    ...db.users[userIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  // If password is being updated, hash it
  if (req.body.password) {
    updatedUser.password = await bcrypt.hash(req.body.password, 10);
  }
  
  db.users[userIndex] = updatedUser;
  
  if (writeDB(db)) {
    const { password: _pwd, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } else {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
app.delete('/api/users/:id', (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = db.users[userIndex];
  db.users.splice(userIndex, 1);
  
  if (writeDB(db)) {
    const { password: _pwd, ...userWithoutPassword } = deletedUser;
    res.json({ message: 'User deleted successfully', deletedUser: userWithoutPassword });
  } else {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===== IMAGE UPLOAD ENDPOINTS =====
import { uploadImage } from './cloudinaryService.js';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// POST /api/upload/image - Upload image to Cloudinary
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 === Image Upload Request ===');
    console.log('File received:', req.file ? 'YES' : 'NO');
    
    if (!req.file || !req.file.buffer) {
      console.error('❌ No image file in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}_${randomString}`;
    
    console.log('📸 Uploading image to Cloudinary:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      generatedFilename: filename
    });

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadImage(req.file.buffer, filename);
    
    console.log('✅ Image uploaded successfully to:', cloudinaryUrl);
    
    // Return proxied URL to bypass SSL issues
    const baseUrl = process.env.VERCEL ? 'https://kp-mocha.vercel.app' : `http://localhost:${PORT}`;
    const proxiedUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(cloudinaryUrl)}`;
    
    res.json({
      success: true,
      filename: filename,
      url: proxiedUrl, // Return proxied URL
      originalUrl: cloudinaryUrl // Keep original for reference
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// GET /api/proxy-image - Proxy Cloudinary images to bypass SSL issues
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Fetch image from Cloudinary via server (no SSL issues server-side)
    const https = await import('https');
    const http = await import('http');
    
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, (imageResponse) => {
      // Set headers
      res.setHeader('Content-Type', imageResponse.headers['content-type'] || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 year
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Pipe image data to response
      imageResponse.pipe(res);
    }).on('error', (err) => {
      console.error('❌ Proxy image error:', err);
      res.status(500).json({ error: 'Failed to proxy image' });
    });
  } catch (error) {
    console.error('❌ Proxy image error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// GET /uploads/images/:filename - Redirect for backward compatibility
app.get('/uploads/images/:filename', (req, res) => {
  console.log('⚠️ Old image URL accessed:', req.params.filename);
  res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Images are now served from Cloudinary. Please update your image URLs.',
    filename: req.params.filename
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== SERVER START =====
// Only start server in local development (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('🚀 ===== PERGUNU API SERVER STARTED =====');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔔 SSE endpoint: http://localhost:${PORT}/api/news/events`);
    console.log('📰 News API endpoints:');
    console.log('  GET /api/news - Get all news');
    console.log('  GET /api/news/:id - Get news by ID');
    console.log('  POST /api/news - Create new news');
    console.log('  PUT /api/news/:id - Update news');
    console.log('  DELETE /api/news/:id - Delete news');
    console.log('  PUT /api/news/:id/feature - Set as featured');
    console.log('🌟 Ready to serve!');
  });
}

// Export for Vercel serverless function
export default app;

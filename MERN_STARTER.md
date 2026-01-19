# MERN Stack Starter Guide

## Table of Contents
- [Introduction](#introduction)
- [What is MERN?](#what-is-mern)
- [Prerequisites](#prerequisites)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Connecting Frontend and Backend](#connecting-frontend-and-backend)
- [Database Setup](#database-setup)
- [Authentication](#authentication)
- [Best Practices](#best-practices)
- [Deployment](#deployment)
- [Resources](#resources)

## Introduction

This guide will help you get started with building a full-stack web application using the MERN stack. MERN is one of the most popular technology stacks for building modern web applications.

## What is MERN?

MERN is an acronym for four technologies that make up the stack:

- **M**ongoDB - NoSQL database for storing data
- **E**xpress.js - Web application framework for Node.js
- **R**eact - Frontend library for building user interfaces
- **N**ode.js - JavaScript runtime for server-side development

## Prerequisites

Before starting with MERN development, ensure you have:

- Basic knowledge of JavaScript (ES6+)
- Understanding of HTML and CSS
- Familiarity with command line/terminal
- Node.js (v14 or higher) and npm installed
- MongoDB installed locally or MongoDB Atlas account
- Code editor (VS Code recommended)
- Git for version control

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Minimal and flexible Node.js web application framework
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB

### Frontend
- **React**: Component-based UI library
- **React Router**: Navigation and routing
- **Axios**: HTTP client for API requests
- **State Management**: Context API, Redux, or Zustand

### Additional Tools
- **dotenv**: Environment variable management
- **cors**: Cross-Origin Resource Sharing middleware
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **nodemon**: Auto-restart server during development

## Project Structure

A typical MERN application structure:

```
mern-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### 1. Initialize Your Project

```bash
# Create project directory
mkdir mern-app
cd mern-app

# Initialize Git
git init
```

### 2. Create .gitignore

```bash
node_modules/
.env
.DS_Store
build/
dist/
*.log
```

## Backend Setup

### 1. Initialize Node.js Project

```bash
# Create server directory
mkdir server
cd server

# Initialize npm
npm init -y
```

### 2. Install Backend Dependencies

```bash
# Core dependencies
npm install express mongoose dotenv cors

# Development dependencies
npm install -D nodemon
```

### 3. Create Server Entry Point (server.js)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MERN API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. Create .env File

```
MONGODB_URI=mongodb://localhost:27017/mern-app
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

### 5. Update package.json Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### 6. Create a Model (models/User.js)

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
```

### 7. Create Routes (routes/userRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
```

## Frontend Setup

### 1. Create React App

```bash
# From root directory
npx create-react-app client
cd client
```

### 2. Install Frontend Dependencies

```bash
npm install axios react-router-dom
```

### 3. Configure Proxy (package.json)

Add this to your client's package.json to avoid CORS during development:

```json
"proxy": "http://localhost:5000"
```

### 4. Create API Service (src/services/api.js)

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Add authorization token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### 5. Create Components

Example component (src/components/UserList.js):

```javascript
import React, { useState, useEffect } from 'react';
import API from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user._id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
```

## Connecting Frontend and Backend

### 1. Update server.js to use routes

```javascript
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/api/users', userRoutes);
```

### 2. Configure Environment Variables

Create `.env` in client directory:

```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Run Both Servers

You can use `concurrently` to run both servers:

```bash
npm install -D concurrently
```

Add to root package.json:

```json
"scripts": {
  "client": "cd client && npm start",
  "server": "cd server && npm run dev",
  "dev": "concurrently \"npm run server\" \"npm run client\""
}
```

## Database Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Update MONGODB_URI in .env file

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Authentication

### 1. Install Authentication Packages

```bash
npm install bcryptjs jsonwebtoken
```

### 2. Create Authentication Middleware (middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication required' });
  }
};

module.exports = auth;
```

### 3. Create Auth Controller (controllers/authController.js)

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

## Best Practices

### Backend
- Use environment variables for sensitive data
- Implement proper error handling
- Use async/await for asynchronous operations
- Validate input data
- Use middleware for authentication
- Implement proper logging
- Use HTTP status codes correctly
- Keep routes modular and organized

### Frontend
- Keep components small and reusable
- Use proper state management
- Implement error boundaries
- Use environment variables
- Optimize performance with React.memo and useMemo
- Implement proper loading states
- Handle errors gracefully
- Use proper folder structure

### Security
- Never commit .env files
- Hash passwords before storing
- Use HTTPS in production
- Implement rate limiting
- Validate and sanitize all inputs
- Use CORS properly
- Keep dependencies updated
- Implement proper authentication and authorization

### Code Quality
- Use ESLint and Prettier
- Write meaningful commit messages
- Comment complex logic
- Use consistent naming conventions
- Keep functions small and focused
- Write DRY (Don't Repeat Yourself) code

## Deployment

### Backend Deployment Options
- **Heroku**: Easy deployment for Node.js apps
- **AWS EC2**: More control and flexibility
- **DigitalOcean**: Simple and affordable
- **Railway**: Modern deployment platform
- **Render**: Free tier available

### Frontend Deployment Options
- **Vercel**: Optimized for React apps
- **Netlify**: Easy static site hosting
- **AWS S3 + CloudFront**: Scalable and fast
- **GitHub Pages**: Free for public repos

### Deployment Checklist
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Build frontend (`npm run build`)
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging
- [ ] Test in production environment
- [ ] Set up backup strategy

## Resources

### Documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Tutorials
- [MDN Web Docs](https://developer.mozilla.org/)
- [freeCodeCamp](https://www.freecodecamp.org/)
- [The Odin Project](https://www.theodinproject.com/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI
- [VS Code](https://code.visualstudio.com/) - Code editor
- [Git](https://git-scm.com/) - Version control

### Community
- [Stack Overflow](https://stackoverflow.com/)
- [Reddit r/webdev](https://www.reddit.com/r/webdev/)
- [Dev.to](https://dev.to/)
- [GitHub](https://github.com/)

## Next Steps

After completing this starter guide, consider learning:
- TypeScript for type safety
- Testing (Jest, React Testing Library)
- GraphQL as an alternative to REST
- Docker for containerization
- Microservices architecture
- CI/CD pipelines
- Advanced state management (Redux Toolkit, Zustand)
- Server-side rendering (Next.js)

---

**Happy Coding! 🚀**

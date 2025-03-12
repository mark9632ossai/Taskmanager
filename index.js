import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';
import { connectDB } from './mongodb/config/dbconnection.js';
import Task from './mongodb/models/users-model.js';
import User from './mongodb/models/user-model.js';
import timetableRoutes from './timetable.js';
import './mongodb/config/passport.js';
import multer from 'multer';

dotenv.config(); // Load environment variables

const app = express();

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Make flash messages available in all templates
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Use timetable routes
app.use('/', timetableRoutes);

// Routes

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('error') });
});

// Login Logic
app.post('/login', passport.authenticate('local', {
  successRedirect: '/tasks',
  failureRedirect: '/login',
  failureFlash: true,
}));

// Registration Page
app.get('/register', (req, res) => {
  res.render('register', { messages: req.flash() });
});

// Register Logic
app.post('/register', async (req, res) => {
  let { username, password } = req.body;
  username = username.trim();

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash('error', 'Username already taken. Please choose another.');
      return res.redirect('/register');
    }

    const user = new User({ username, password });
    await user.save();

    req.flash('success', 'Registration successful! You can now log in.');
    res.redirect('/login');
  } catch (error) {
    console.error('Error registering user:', error);
    req.flash('error', 'Internal Server Error');
    res.redirect('/register');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out');
    }
    req.flash('success', 'Logged out successfully.');
    res.redirect('/login');
  });
});

// Redirect root to tasks
app.get('/', (req, res) => {
  res.redirect('/tasks');
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in first.');
  res.redirect('/login');
}

// Settings Page
app.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('settings', { user: req.user });
});

// Update Profile Logic
app.post('/settings', ensureAuthenticated, async (req, res) => {
  const { name, bio, profilePicture } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/settings');
    }

    user.name = name;
    user.bio = bio;
    user.profilePicture = profilePicture;

    await user.save();
    req.flash('success', 'Profile updated successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Failed to update profile.');
    res.redirect('/settings');
  }
});

// List tasks
app.get('/tasks', ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.render('list-tasks', { tasks, user: req.user });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Search tasks by name or serial number
app.get('/tasks/search', ensureAuthenticated, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.redirect('/tasks');

    // Fetch all tasks for the current user
    const tasks = await Task.find({ user: req.user._id }).lean();

    let filteredTasks;
    // If the query is numeric, treat it as a serial number (index + 1)
    if (/^\d+$/.test(query)) {
      const serialNum = parseInt(query, 10);
      filteredTasks = tasks.filter((task, index) => index + 1 === serialNum);
    } else {
      // Otherwise, perform a case-insensitive search on the task name
      const regex = new RegExp(query, 'i');
      filteredTasks = tasks.filter(task => regex.test(task.task));
    }

    res.render('list-tasks', { tasks: filteredTasks, user: req.user });
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Add Task page
app.get('/tasks/add', ensureAuthenticated, (req, res) => {
  res.render('Add-task');
});

// Add a new task
app.post('/tasks/add', ensureAuthenticated, async (req, res) => {
  const { task, check, alarm } = req.body;
  try {
    const newTask = new Task({
      task,
      check: check === 'on',
      alarm: alarm ? new Date(alarm) : null,
      user: req.user._id,
    });
    await newTask.save();
    req.flash('success', 'Task added successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error adding task:', error);
    req.flash('error', 'Failed to add task.');
    res.redirect('/tasks');
  }
});

// View single task
app.get('/tasks/single-task/:id', ensureAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      req.flash('error', 'Task not found.');
      return res.redirect('/tasks');
    }
    res.render('single-task', { task, taskStatus: task.check ? 'Task is done' : 'Task is undone' });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Edit Task Page
app.get('/tasks/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      req.flash('error', 'Task not found.');
      return res.redirect('/tasks');
    }
    res.render('Edit-task', { task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update task
app.put('/tasks/edit/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { task: updatedTask, check, alarm } = req.body;
  try {
    const task = await Task.findById(id);
    if (!task) {
      req.flash('error', 'Task not found.');
      return res.redirect('/tasks');
    }

    task.task = updatedTask;
    task.check = check === 'on';
    task.alarm = alarm ? new Date(alarm) : null;
    if (task.check) task.alarm = null;

    await task.save();
    req.flash('success', 'Task updated successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete task
app.delete('/tasks/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    req.flash('success', 'Task deleted successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

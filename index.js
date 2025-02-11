import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './mongodb/config/dbconnection.js'; // Ensure this reads your MONGO_URI from env
import Task from './mongodb/models/users-model.js';
import timetableRoutes from './timetable.js'; // Import the timetable routes
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash'; // Import connect-flash
import './mongodb/config/passport.js'; // Import Passport configuration
import User from './mongodb/models/user-model.js'; // Import User model

const app = express();

// For ES Modules, define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Session middleware
app.use(
  session({
    secret: 'your-secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
  })
);

// Use connect-flash
app.use(flash());

// Make flash messages available in all templates
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine and define the views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to store flash messages in response locals
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Use the timetable routes
app.use('/', timetableRoutes);

// Routes

// Render Login page
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('error') });
});

// Handle Login form submission
app.post('/login', passport.authenticate('local', {
  successRedirect: '/tasks',
  failureRedirect: '/login',
  failureFlash: true, // Flash message on failure
}));

// Render Registration page
app.get('/register', (req, res) => {
  res.render('register', { messages: req.flash() });
});

// Handle Registration form submission
app.post('/register', async (req, res) => {
  let { username, password } = req.body;
  
  // Trim and normalize input
  username = username.trim();

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { messages: { error: 'Username already taken. Please choose another.' } });
    }

    // Create and save new user
    const user = new User({ username, password });
    await user.save();

    res.render('register', { messages: { success: 'Registration successful! You can now log in.' } });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send('Error logging out');
    req.flash('success', 'Logged out successfully.');
    res.redirect('/login');
  });
});

// Redirect root to tasks list
app.get('/', (req, res) => {
  res.redirect('/tasks');
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in first.');
  res.redirect('/login');
}

// Display all tasks
app.get('/tasks', ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }); // Filter tasks by user
    res.render('list-tasks', { tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
      user: req.user._id, // Associate task with the logged-in user
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

// View a single task
app.get('/tasks/single-task/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) {
      req.flash('error', 'Task not found.');
      return res.redirect('/tasks');
    }
    const taskStatus = task.check ? 'Task is done' : 'Task is undone';
    res.render('single-task', { task, taskStatus });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Edit Task page
app.get('/tasks/edit/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
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

// Update a task
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
    // Clear alarm if task is marked as completed
    if (task.check) task.alarm = null;
    await task.save();
    req.flash('success', 'Task updated successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a task
app.delete('/tasks/delete/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await Task.findByIdAndDelete(id);
    req.flash('success', 'Task deleted successfully.');
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server using the environment port if available
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

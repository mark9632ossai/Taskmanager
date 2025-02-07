import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './mongodb/config/dbconnection.js'; // Import the connectDB function
import Task from './mongodb/models/users-model.js'; // Import the Task model

const app = express();

// If you need __dirname when using ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine and define the views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes

// Redirect root to tasks list
app.get('/', (req, res) => {
  res.redirect('/tasks');
});

// Display all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find(); // Fetch tasks from MongoDB
    res.render('list-tasks', { tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Add Task page
app.get('/tasks/add', (req, res) => {
  // Note: when using EJS, you can omit the extension
  res.render('Add-task');
});

// Add a new task
app.post('/tasks/add', async (req, res) => {
  const { task, check, alarm } = req.body;
  try {
    const newTask = new Task({
      task,
      check: check === 'on',
      alarm: alarm ? new Date(alarm) : null,
    });
    await newTask.save();
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// View a single task
app.get('/tasks/single-task/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).send('Task not found');
    }
    const taskStatus = task.check ? 'Task is done' : 'Task is undone';
    res.render('single-task', { task, taskStatus });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Edit Task page
app.get('/tasks/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).send('Task not found');
    }
    res.render('Edit-task', { task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update a task
app.put('/tasks/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { task: updatedTask, check, alarm } = req.body;
  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).send('Task not found');
    }
    // Update the task details
    task.task = updatedTask;
    task.check = check === 'on';
    task.alarm = alarm ? new Date(alarm) : null;

    // If the task is marked as complete, clear the alarm
    if (task.check) {
      task.alarm = null;
    }
    await task.save();
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a task
app.delete('/tasks/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Task.findByIdAndDelete(id);
    res.redirect('/tasks');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Use the port from the environment if available (important for deployment)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

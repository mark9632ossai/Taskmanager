import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import { connectDB } from './mongodb/config/dbconection.js';

let tasks = [
    { id: 1, task: "Sample Task 1", check: false },
    { id: 2, task: "Sample Task 2", check: true },
];

// Connect to the database (if applicable)
connectDB();

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Redirect to the tasks list
app.get('/', (req, res) => {
    res.redirect('/tasks');
});

// Display all tasks
app.get('/tasks', (req, res) => {
    res.render('list-tasks', { tasks });
});

// Render Add Task page
app.get('/tasks/add', (req, res) => {
    res.render('Add-task.ejs');
});

// Add a new task
app.post('/tasks/add', (req, res) => {
    const { task, check } = req.body;
    const newTask = {
        id: tasks.length + 1,
        task,
        check: check === 'on', // Checkbox sends 'on' when checked
    };

    tasks.push(newTask);
    res.redirect('/tasks');
});

// View a single task
app.get('/tasks/single-task/:id', (req, res) => {
    const { id } = req.params;
    const task = tasks.find((u) => u.id === parseInt(id));

    if (!task) {
        return res.status(404).send('Task not found');
    }

    // Determine task status
    const taskStatus = task.check ? "Task is done" : "Task is undone";

    res.render('single-task.ejs', { task, taskStatus });
});


// Render Edit Task page
app.get('/tasks/edit/:id', (req, res) => {
    const { id } = req.params;
    const task = tasks.find((u) => u.id === parseInt(id));

    if (!task) {
        return res.status(404).send('Task not found');
    }

    res.render('Edit-task.ejs', { task });
});

// Update a task
app.put('/tasks/edit/:id', (req, res) => {
    const { id } = req.params;
    const { task: updatedTask, check } = req.body;

    const task = tasks.find((u) => u.id === parseInt(id));

    if (!task) {
        return res.status(404).send('Task not found');
    }

    // Update task fields
    task.task = updatedTask;
    task.check = check === 'on';

    res.redirect('/tasks');
});

// Delete a task and update S/N
app.post('/tasks/delete/:id', (req, res) => {
    const { id } = req.params;

    // Remove the task
    tasks = tasks.filter((u) => u.id !== parseInt(id));

    // Reassign IDs to maintain proper S/N order
    tasks = tasks.map((task, index) => ({
        ...task,
        id: index + 1, // Reassign IDs starting from 1
    }));

    res.redirect('/tasks');
});

// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

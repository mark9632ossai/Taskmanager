import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

const app = express();

// In-memory storage for tasks
let tasks = [];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Serve static files
app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

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
    const { task, check, alarm } = req.body;
    const newTask = {
        id: tasks.length + 1,
        task,
        check: check === 'on',
        alarm: alarm ? new Date(alarm) : null,
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
    const { task: updatedTask, check, alarm } = req.body;

    const task = tasks.find((u) => u.id === parseInt(id));

    if (!task) {
        return res.status(404).send('Task not found');
    }

    task.task = updatedTask;
    task.check = check === 'on';
    task.alarm = alarm ? new Date(alarm) : null;

    res.redirect('/tasks');
});

// Delete a task
app.delete('/tasks/delete/:id', (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((u) => u.id !== parseInt(id));
    res.redirect('/tasks');
});

// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
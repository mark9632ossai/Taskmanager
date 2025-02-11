// timetable-routes.js

import express from 'express';
import ClassModel from './mongodb/models/class-model.js';

const app = express();

// Display the timetable (all classes)
app.get('/timetable', async (req, res) => {
  try {
    const classes = await ClassModel.find();
    res.render('timetable', { classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Add Class page
app.get('/timetable/add', (req, res) => {
  res.render('add-class');
});

// Add a new class
app.post('/timetable/add', async (req, res) => {
  const { subject, day, startTime, endTime, alarm } = req.body;
  try {
    const newClass = new ClassModel({
      subject,
      day,
      startTime,
      endTime,
      alarm: alarm ? new Date(alarm) : null,
    });
    await newClass.save();
    res.redirect('/timetable');
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Render Edit Class page
app.get('/timetable/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const classItem = await ClassModel.findById(id);
    if (!classItem) return res.status(404).send('Class not found');
    res.render('edit-class', { classItem });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update a class
app.put('/timetable/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { subject, day, startTime, endTime, alarm } = req.body;
  try {
    const classItem = await ClassModel.findById(id);
    if (!classItem) return res.status(404).send('Class not found');
    classItem.subject = subject;
    classItem.day = day;
    classItem.startTime = startTime;
    classItem.endTime = endTime;
    classItem.alarm = alarm ? new Date(alarm) : null;
    await classItem.save();
    res.redirect('/timetable');
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a class
app.delete('/timetable/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await ClassModel.findByIdAndDelete(id);
    res.redirect('/timetable');
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the app object
export default app;
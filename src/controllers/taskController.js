// All CRUD operations for tasks.
// All queries are scoped to req.user.id — users can ONLY access their own tasks.

const Task = require('../models/Task');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// GET /tasks — list tasks with optional filtering and sorting
const getTasks = async (req, res, next) => {
  try {
    const { filter = 'all', sort = 'newest' } = req.query;

    // Build the query — always filter by the logged-in user's ID
    const query = { userId: req.user.id };

    if (filter === 'pending') {
      query.status = 'pending';
    } else if (filter === 'completed') {
      query.status = 'completed';
    } else {
      // 'all' filter: show pending and completed, but NOT deleted
      query.status = { $in: ['pending', 'completed'] };
    }

    // Sorting
    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const tasks = await Task.find(query).sort(sortOption);

    logger.info(`Tasks fetched for user ${req.user.id}, filter: ${filter}, count: ${tasks.length}`);

    res.render('tasks/index', {
      title: 'My Tasks',
      tasks,
      filter,
      sort,
      username: req.user.username,
    });
  } catch (error) {
    next(error);
  }
};

// GET /tasks/new
const showCreateForm = (req, res) => {
  res.render('tasks/form', {
    title: 'New Task',
    task: null,
    error: null,
    username: req.user.username,
  });
};

// POST /tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('tasks/form', {
        title: 'New Task',
        task: null,
        error: errors.array()[0].msg,
        username: req.user.username,
      });
    }

    const { title, description } = req.body;

    const task = await Task.create({
      title,
      description,
      userId: req.user.id, // Always associate with the authenticated user
    });

    logger.info(`Task created: "${task.title}" by user ${req.user.id}`);
    res.redirect('/tasks');
  } catch (error) {
    next(error);
  }
};

// GET /tasks/:id/edit
const showEditForm = async (req, res, next) => {
  try {
    // The userId filter ensures users can only edit their OWN tasks (authorization)
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Task not found',
        statusCode: 404,
      });
    }

    res.render('tasks/form', {
      title: 'Edit Task',
      task,
      error: null,
      username: req.user.username,
    });
  } catch (error) {
    next(error);
  }
};

// POST /tasks/:id — update task (title, description, status)
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
      return res.status(400).render('tasks/form', {
        title: 'Edit Task',
        task,
        error: errors.array()[0].msg,
        username: req.user.username,
      });
    }

    const { title, description, status } = req.body;

    // Authorization: userId filter prevents users from modifying others' tasks
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, description, status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Task not found or not authorized',
        statusCode: 404,
      });
    }

    logger.info(`Task updated: "${task.title}" (${task._id}) by user ${req.user.id}`);
    res.redirect('/tasks');
  } catch (error) {
    next(error);
  }
};

// POST /tasks/:id/delete — soft delete (sets status to 'deleted')
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'deleted' },
      { new: true }
    );

    if (!task) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Task not found or not authorized',
        statusCode: 404,
      });
    }

    logger.info(`Task soft-deleted: "${task.title}" (${task._id}) by user ${req.user.id}`);
    res.redirect('/tasks');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, showCreateForm, createTask, showEditForm, updateTask, deleteTask };
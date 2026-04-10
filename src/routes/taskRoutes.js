const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks, showCreateForm, createTask,
  showEditForm, updateTask, deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// All task routes require authentication
router.use(protect);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').trim().isLength({ max: 1000 }).withMessage('Description too long').optional(),
];

router.get('/', getTasks);
router.get('/new', showCreateForm);
router.post('/', taskValidation, createTask);
router.get('/:id/edit', showEditForm);
router.post('/:id', taskValidation, updateTask);
router.post('/:id/delete', deleteTask);

module.exports = router;
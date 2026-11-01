const {body} = require('express-validator');

const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({min: 3, max: 50}).withMessage('Name must be between 3 and 50 characters'),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({min: 8}).withMessage('Password must be at least 8 characters long')
];

const loginValidator = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('password')
        .notEmpty().withMessage('Password is required')
];

module.exports = {
    registerValidator,
    loginValidator
};
class UserExistsError extends Error {
    constructor() {
        super();
        this.message = 'User already exists';
        this.name = 'UserUniquenessError';
    }
}

class InternalServerError extends Error {
    constructor() {
        super();
        this.message = 'Internal server error';
        this.name = 'InternalServerError';
    }
}

class InvalidEmailOrPasswordError extends Error {
    constructor() {
        super();
        this.message = 'Invalid email or password';
        this.name = 'InvalidEmailOrPasswordError';
    }
}

class InvalidAuthorizationError extends Error {
    constructor() {
        super();
        this.message = 'Invalid Authorization header';
        this.name = 'InvalidAuthorizationError';
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super();
        this.message = message || 'Not Found';
        this.name = 'NotFoundError';
    }
}

module.exports = {
    UserExistsError,
    InternalServerError,
    InvalidEmailOrPasswordError,
    InvalidAuthorizationError,
    NotFoundError
};
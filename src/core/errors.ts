// A base class for all our operational errors.
// 'operational' means it's an expected error, not a bug in the code.
export class BaseError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(name: string, statusCode: number, description: string, isOperational: boolean) {
      super(description);
      Object.setPrototypeOf(this, new.target.prototype);
  
      this.name = name;
      this.statusCode = statusCode;
      this.isOperational = isOperational;
  
      Error.captureStackTrace(this);
    }
  }
  
  // Used for API errors we create, e.g., "Not Found".
  export class ApiError extends BaseError {
    constructor(name: string, statusCode = 500, description = 'Internal server error.') {
      super(name, statusCode, description, true);
    }
  }
  
  // Used specifically when Zod validation of incoming data fails.
  export class ValidationError extends BaseError {
    constructor(description = 'Validation failed.') {
      super('BAD_REQUEST', 400, description, true);
    }
  }
  
  // Used to encapsulate errors from external services like OpenAI.
  export class ExternalServiceError extends BaseError {
    constructor(name = 'EXTERNAL_SERVICE_ERROR', description = 'An external service failed.') {
      super(name, 502, description, true); // 502 Bad Gateway is appropriate here
    }
  }
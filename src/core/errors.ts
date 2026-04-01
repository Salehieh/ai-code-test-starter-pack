// En basklass för alla våra operationella fel.
// 'operational' betyder att det är ett förväntat fel, inte en bugg i koden.
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
  
  // Används för API-fel som vi skapar, t.ex. "Not Found".
  export class ApiError extends BaseError {
    constructor(name: string, statusCode = 500, description = 'Internal server error.') {
      super(name, statusCode, description, true);
    }
  }
  
  // Används specifikt när Zod-validering av inkommande data misslyckas.
  export class ValidationError extends BaseError {
    constructor(description = 'Validation failed.') {
      super('BAD_REQUEST', 400, description, true);
    }
  }
  
  // Används för att kapsla in fel från externa tjänster som OpenAI.
  export class ExternalServiceError extends BaseError {
    constructor(name = 'EXTERNAL_SERVICE_ERROR', description = 'An external service failed.') {
      super(name, 502, description, true); // 502 Bad Gateway är passande här
    }
  }
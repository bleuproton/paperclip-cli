export class PaperclipError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = 'PaperclipError';
  }
}

export class AuthError extends PaperclipError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends PaperclipError {
  constructor(message: string) {
    super(message, 3);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends PaperclipError {
  constructor(message: string) {
    super(message, 4);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends PaperclipError {
  constructor(message: string) {
    super(message, 5);
    this.name = 'NetworkError';
  }
}

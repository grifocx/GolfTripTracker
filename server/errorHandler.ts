import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message: string) => new AppError(message, 400, "BAD_REQUEST"),
  unauthorized: (message: string = "Unauthorized") => new AppError(message, 401, "UNAUTHORIZED"),
  forbidden: (message: string = "Forbidden") => new AppError(message, 403, "FORBIDDEN"),
  notFound: (message: string) => new AppError(message, 404, "NOT_FOUND"),
  conflict: (message: string) => new AppError(message, 409, "CONFLICT"),
  internal: (message: string = "Internal server error") => new AppError(message, 500, "INTERNAL_ERROR"),
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", {
    message: error.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const message = fromZodError(err).message;
    error = createError.badRequest(message);
  }

  // Database errors
  if (err.message?.includes("duplicate key")) {
    error = createError.conflict("Resource already exists");
  }

  if (err.message?.includes("foreign key")) {
    error = createError.badRequest("Invalid reference to related resource");
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code || "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};
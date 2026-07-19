class ApiError extends Error {
  public statusCode: number;

  constructor(
    statusCode: number,
    message = "something went wrong",
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.stack = stack;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };

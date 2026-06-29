export class UpstreamHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "UpstreamHttpError";
  }
}

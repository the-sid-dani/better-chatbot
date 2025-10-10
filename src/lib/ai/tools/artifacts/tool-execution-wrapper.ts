import logger from "../../../logger";

/**
 * Timeout wrapper for async generator tool execution
 *
 * Prevents tools from hanging indefinitely due to AI SDK async generator
 * completion issues. Wraps tool execution with configurable timeout.
 *
 * @param generator - The async generator to wrap
 * @param timeoutMs - Timeout in milliseconds (default 30s)
 * @returns Wrapped generator with timeout protection
 */
export function withTimeout<T>(
  generator: AsyncGenerator<any, T, unknown>,
  timeoutMs = 30000,
): AsyncGenerator<any, T, unknown> {
  return (async function* () {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    );

    try {
      let result = await generator.next();

      while (!result.done) {
        // Yield intermediate results (loading, processing states)
        yield result.value;

        // Race next result against timeout
        result = await Promise.race([generator.next(), timeoutPromise]);
      }

      // Return final result if generator completes
      return result.value;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Tool execution timeout:", {
        error: errorMessage,
        timeoutMs,
      });

      // Throw descriptive error for client handling
      throw new Error(
        `Chart generation timeout after ${Math.floor(timeoutMs / 1000)}s`,
      );
    }
  })();
}

/**
 * Type guard for timeout errors
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("timeout");
}

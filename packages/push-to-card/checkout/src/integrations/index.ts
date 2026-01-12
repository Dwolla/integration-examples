/**
 * Retrieves an environment variable by key.
 * 
 * This helper function provides type-safe access to environment variables.
 * It assumes the variable exists and will throw at runtime if used with undefined values.
 * 
 * @param key - The environment variable key (e.g., "DWOLLA_KEY", "CKO_SECRET_KEY")
 * @returns The value of the environment variable as a string
 * 
 * @example
 * ```typescript
 * const dwollaEnv = getEnvironmentVariable("DWOLLA_ENV");
 * const secretKey = getEnvironmentVariable("CKO_SECRET_KEY");
 * ```
 */
export const getEnvironmentVariable = (key: string): string => process.env[key] as string;

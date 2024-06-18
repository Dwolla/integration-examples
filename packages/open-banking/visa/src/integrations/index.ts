export const getEnvironmentVariable = (key: string): string => process.env[key] as string;

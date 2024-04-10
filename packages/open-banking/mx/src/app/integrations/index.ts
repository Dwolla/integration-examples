import { v4 } from "uuid";

export const getEnvironmentVariable = (key: string): string => process.env[key] as string;

export const newUuid = (): string => v4();

import { getMissingKeys } from "./index";

export interface ValidationResult<T> {
    isValid: boolean;
    missingKeys: (keyof T)[];
}

/**
 * Gets if the form is valid by ensuring all required fields have a present value.
 * @returns a {@link ValidationResult} object that contains if the form was valid as well
 * as any missing keys, if any were present
 */
export default function getFormValidation<T>(formData: T, keys: (keyof T)[]): ValidationResult<T> {
    const missingKeys = getMissingKeys(formData, keys);
    const isValid = missingKeys.length === 0;
    return { missingKeys, isValid };
}

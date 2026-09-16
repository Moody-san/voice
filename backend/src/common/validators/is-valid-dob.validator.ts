import { registerDecorator, ValidationOptions } from 'class-validator';
import { parseDob } from '../utils/dob.util';

/**
 * class-validator decorator: value must be a real calendar date, not in the
 * future, given as MM/DD/YYYY or YYYY-MM-DD.
 */
export function IsValidDob(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDob',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return parseDob(value) !== null;
        },
        defaultMessage() {
          return `${propertyName} must be a valid date (MM/DD/YYYY) that is not in the future`;
        },
      },
    });
  };
}

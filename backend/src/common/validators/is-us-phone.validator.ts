import { registerDecorator, ValidationOptions } from 'class-validator';
import { normalizeUsPhone } from '../utils/phone.util';

/** class-validator decorator: value must be a valid US 10-digit phone number. */
export function IsUsPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUsPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return normalizeUsPhone(value) !== null;
        },
        defaultMessage() {
          return `${propertyName} must be a valid US 10-digit phone number`;
        },
      },
    });
  };
}

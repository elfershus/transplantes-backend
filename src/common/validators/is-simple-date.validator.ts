import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom validator that accepts dates in YYYY-MM-DD format
 */
export function IsSimpleDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSimpleDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Skip validation if value is empty

          // Check if the value is a string and matches YYYY-MM-DD format
          if (typeof value === 'string') {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (regex.test(value)) {
              // Validate that it's an actual valid date
              const date = new Date(value);
              return !isNaN(date.getTime());
            }
          }

          // If it's already a Date object, it's valid
          if (value instanceof Date) {
            return !isNaN(value.getTime());
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in YYYY-MM-DD format`;
        },
      },
    });
  };
}

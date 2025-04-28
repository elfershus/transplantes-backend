import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string, metadata: ArgumentMetadata): Date {
    if (!value) {
      throw new BadRequestException('Date parameter is required');
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `Invalid date format: ${value}. Please use ISO format (YYYY-MM-DD)`,
      );
    }

    return date;
  }
}

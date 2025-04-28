// src/shared/services/search-filter.service.ts
import { Injectable } from '@nestjs/common';
import {
  Repository,
  FindManyOptions,
  ILike,
  Between,
  LessThan,
  MoreThan,
  In,
  ObjectLiteral,
} from 'typeorm';

@Injectable()
export class SearchFilterService {
  applyFilters<T extends ObjectLiteral>(
    repository: Repository<T>,
    filters: any,
    pagination?: { page: number; limit: number },
    sorting?: { field: string; order: 'ASC' | 'DESC' }[],
  ): FindManyOptions<T> {
    const where: any = {};
    const options: FindManyOptions<T> = {};

    // Process filter criteria
    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key];

        if (value === undefined) return;

        if (typeof value === 'string' && value.trim() !== '') {
          where[key] = ILike(`%${value}%`);
        } else if (Array.isArray(value) && value.length > 0) {
          where[key] = In(value);
        } else if (value && typeof value === 'object') {
          if (value.min !== undefined && value.max !== undefined) {
            where[key] = Between(value.min, value.max);
          } else if (value.min !== undefined) {
            where[key] = MoreThan(value.min);
          } else if (value.max !== undefined) {
            where[key] = LessThan(value.max);
          }
        } else if (value !== null && value !== '') {
          where[key] = value;
        }
      });
    }

    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    if (pagination) {
      options.skip = (pagination.page - 1) * pagination.limit;
      options.take = pagination.limit;
    }

    if (sorting && sorting.length > 0) {
      const order: Record<string, 'ASC' | 'DESC'> = {};
      sorting.forEach((sort) => {
        order[sort.field] = sort.order;
      });
      options.order = order as any; // Type assertion needed due to TypeORM's complex typing
    }

    return options;
  }
}

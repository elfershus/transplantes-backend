import { Body, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { GenericCrudService } from '../services/generic-crud.service';
import { SearchFilterService } from '../services/search-filter.service';
import { BaseEntity } from '../entities/base.entity';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

export abstract class BaseController<T extends BaseEntity> {
  constructor(
    protected readonly service: GenericCrudService<T>,
    protected readonly searchFilterService: SearchFilterService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: any) {
    // Extract pagination params
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    // Extract sorting params
    const sorting: SortingOption[] = [];

    if (query.sort) {
      const sortFields = Array.isArray(query.sort) ? query.sort : [query.sort];
      sortFields.forEach((field) => {
        const [fieldName, order] = field.split(':');
        sorting.push({
          field: fieldName,
          order: order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        });
      });
    }

    // Remove special params from query object to leave only filters
    const filters = { ...query };
    delete filters.page;
    delete filters.limit;
    delete filters.sort;

    // Apply filters, pagination, and sorting
    const options = this.searchFilterService.applyFilters(
      this.service['repository'],
      filters,
      { page, limit },
      sorting,
    );

    // Get results and total count
    const [items, total] = await Promise.all([
      this.service.findAll(options),
      this.service.count({ where: options.where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createDto: any) {
    return this.service.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}

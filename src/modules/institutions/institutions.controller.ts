import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstitutionsService } from './institutions.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('institutions')
@ApiBearerAuth()
@Controller('institutions')
@UseGuards(JwtAuthGuard)
export class InstitutionsController {
  constructor(
    private readonly institutionsService: InstitutionsService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all institutions' })
  @Get()
  async findAll(@Query() query: any) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

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

    const filters = { ...query };
    delete filters.page;
    delete filters.limit;
    delete filters.sort;

    const options = this.searchFilterService.applyFilters(
      this.institutionsService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.withDoctors === 'true') {
      options.relations = ['doctors'];
    }

    const [institutions, total] = await Promise.all([
      this.institutionsService.findAll(options),
      this.institutionsService.count({ where: options.where }),
    ]);

    return {
      items: institutions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get institutions with available organs' })
  @Get('with-available-organs')
  async findWithAvailableOrgans() {
    return this.institutionsService.findInstitutionsWithAvailableOrgans();
  }

  @ApiOperation({ summary: 'Get institution by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(+id, ['doctors']);
  }

  @ApiOperation({ summary: 'Create new institution' })
  @Post()
  async create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @ApiOperation({ summary: 'Update institution' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateInstitutionDto: UpdateInstitutionDto) {
    return this.institutionsService.update(+id, updateInstitutionDto);
  }

  @ApiOperation({ summary: 'Delete institution' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.institutionsService.remove(+id);
  }
}

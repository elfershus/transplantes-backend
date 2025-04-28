import { Controller, Get, Query, Param, Body, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DoctorsService } from './doctors.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('doctors')
@ApiBearerAuth()
@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all doctors' })
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
      this.doctorsService.getRepository(),
      filters,
      { page, limit },
      sorting,
    );

    // Special handling for filtering by institution
    if (filters.institutionId) {
      // Instead of direct filtering, we'll use a custom query
      const institutionId = parseInt(filters.institutionId, 10);
      delete filters.institutionId;

      const [doctors, total] = await Promise.all([
        this.doctorsService.findByInstitution(institutionId, options),
        this.doctorsService.countByInstitution(institutionId, options),
      ]);

      return {
        items: doctors,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } else if (query.withInstitutions === 'true') {
      options.relations = ['institutions'];
    }

    // Normal flow for non-institution filtering
    const [doctors, total] = await Promise.all([
      this.doctorsService.findAll(options),
      this.doctorsService.count({ where: options.where }),
    ]);

    return {
      items: doctors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('count')
  async getCount(@Query() query: any) {
    // Apply filters for counting
    const filters = { ...query };
    delete filters.page;
    delete filters.limit;
    delete filters.sort;

    const options = this.searchFilterService.applyFilters(
      this.doctorsService.getRepository(),
      filters,
    );

    const count = await this.doctorsService.count(options);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(+id, ['institutions']);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(+id, updateDoctorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.doctorsService.remove(+id);
  }
}

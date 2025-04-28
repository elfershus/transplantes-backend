import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DonorsService } from './donors.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('donors')
@ApiBearerAuth()
@Controller('donors')
@UseGuards(JwtAuthGuard)
export class DonorsController {
  constructor(
    private readonly donorsService: DonorsService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all donors' })
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
    delete filters.withClinicHistory;

    const options = this.searchFilterService.applyFilters(
      this.donorsService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.withClinicHistory === 'true') {
      options.relations = ['clinicHistory'];
    }

    const [donors, total] = await Promise.all([
      this.donorsService.findAll(options),
      this.donorsService.count({ where: options.where }),
    ]);

    return {
      items: donors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get active donors' })
  @Get('active')
  async findActive() {
    return this.donorsService.findActiveDonors();
  }

  @ApiOperation({ summary: 'Get donors with available organs' })
  @Get('with-available-organs')
  async findWithAvailableOrgans() {
    return this.donorsService.findWithAvailableOrgans();
  }

  @ApiOperation({ summary: 'Get donors by blood type' })
  @Get('blood-type/:bloodType')
  async findByBloodType(@Param('bloodType') bloodType: string) {
    return this.donorsService.findByBloodType(bloodType);
  }

  @ApiOperation({ summary: 'Get donor by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.donorsService.findOne(+id, ['clinicHistory', 'organs']);
  }

  @ApiOperation({ summary: 'Create new donor' })
  @Post()
  async create(@Body() createDonorDto: CreateDonorDto) {
    return this.donorsService.create(createDonorDto);
  }

  @ApiOperation({ summary: 'Update donor' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDonorDto: UpdateDonorDto) {
    return this.donorsService.update(+id, updateDonorDto);
  }

  @ApiOperation({ summary: 'Delete donor' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.donorsService.remove(+id);
  }
}

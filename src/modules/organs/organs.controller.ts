import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgansService } from './organs.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('organs')
@ApiBearerAuth()
@Controller('organs')
@UseGuards(JwtAuthGuard)
export class OrgansController {
  constructor(
    private readonly organsService: OrgansService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all organs' })
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
    delete filters.withDonor;

    const options = this.searchFilterService.applyFilters(
      this.organsService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.withDonor === 'true') {
      options.relations = ['donor'];
    }

    const [organs, total] = await Promise.all([
      this.organsService.findAll(options),
      this.organsService.count({ where: options.where }),
    ]);

    return {
      items: organs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get available organs' })
  @Get('available')
  async findAvailable() {
    return this.organsService.findAvailableOrgans();
  }

  @ApiOperation({ summary: 'Get available organs by type' })
  @Get('available/:type')
  async findAvailableByType(@Param('type') type: string) {
    return this.organsService.findAvailableOrgansByType(type);
  }

  @ApiOperation({ summary: 'Get expiring organs' })
  @Get('expiring')
  async findExpiring(@Query('hours') hours?: string) {
    const hoursParam = hours ? parseInt(hours, 10) : 24;
    return this.organsService.findExpiringOrgans(hoursParam);
  }

  @ApiOperation({ summary: 'Get organ statistics' })
  @Get('statistics')
  async getStatistics() {
    return this.organsService.getOrganStatistics();
  }

  @ApiOperation({ summary: 'Get organ lifespan statistics' })
  @Get('statistics/lifespan')
  async getLifespanStatistics() {
    return this.organsService.getOrganLifespanStatistics();
  }

  @ApiOperation({ summary: 'Get organ by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organsService.findOne(+id, ['donor', 'compatibilities', 'transportations']);
  }

  @ApiOperation({ summary: 'Create new organ' })
  @Post()
  async create(@Body() createOrganDto: CreateOrganDto) {
    return this.organsService.create(createOrganDto);
  }

  @ApiOperation({ summary: 'Update organ' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateOrganDto: UpdateOrganDto) {
    return this.organsService.update(+id, updateOrganDto);
  }

  @ApiOperation({ summary: 'Delete organ' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.organsService.remove(+id);
  }
}

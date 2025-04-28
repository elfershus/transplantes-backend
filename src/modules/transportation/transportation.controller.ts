import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransportationService } from './transportation.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateTransportationDto } from './dto/create-transportation.dto';
import { UpdateTransportationDto } from './dto/update-transportation.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('transportation')
@ApiBearerAuth()
@Controller('transportation')
@UseGuards(JwtAuthGuard)
export class TransportationController {
  constructor(
    private readonly transportationService: TransportationService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all transportation records' })
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
    delete filters.includeRelations;

    const options = this.searchFilterService.applyFilters(
      this.transportationService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.includeRelations === 'true') {
      options.relations = ['organ', 'originInstitution', 'destinationInstitution'];
    }

    const [transportations, total] = await Promise.all([
      this.transportationService.findAll(options),
      this.transportationService.count({ where: options.where }),
    ]);

    return {
      items: transportations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get active transports' })
  @Get('active')
  async findActive() {
    return this.transportationService.findActiveTransports();
  }

  @ApiOperation({ summary: 'Get delayed transports' })
  @Get('delayed')
  async findDelayed() {
    return this.transportationService.findDelayedTransports();
  }

  @ApiOperation({ summary: 'Get transportation efficiency report' })
  @Get('reports/efficiency')
  async getEfficiencyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transportationService.getTransportationEfficiencyReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOperation({ summary: 'Get transportation route analysis' })
  @Get('reports/routes')
  async getRouteAnalysis() {
    return this.transportationService.getTransportationRouteAnalysis();
  }

  @ApiOperation({ summary: 'Get transportation record by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transportationService.findOne(+id, [
      'organ',
      'originInstitution',
      'destinationInstitution',
    ]);
  }

  @ApiOperation({ summary: 'Create new transportation record' })
  @Post()
  async create(@Body() createTransportationDto: CreateTransportationDto) {
    return this.transportationService.create(createTransportationDto);
  }

  @ApiOperation({ summary: 'Update transportation record' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTransportationDto: UpdateTransportationDto) {
    return this.transportationService.update(+id, updateTransportationDto);
  }

  @ApiOperation({ summary: 'Delete transportation record' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.transportationService.remove(+id);
  }
}

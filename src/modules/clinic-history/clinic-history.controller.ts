import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicHistoryService } from './clinic-history.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateClinicHistoryDto } from './dto/create-clinic-history.dto';
import { UpdateClinicHistoryDto } from './dto/update-clinic-history.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('clinic-history')
@ApiBearerAuth()
@Controller('clinic-history')
@UseGuards(JwtAuthGuard)
export class ClinicHistoryController {
  constructor(
    private readonly clinicHistoryService: ClinicHistoryService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all clinic history records' })
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
    delete filters.includePatient;

    const options = this.searchFilterService.applyFilters(
      this.clinicHistoryService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.includePatient === 'true') {
      options.relations = ['donor', 'receiver'];
    }

    const [histories, total] = await Promise.all([
      this.clinicHistoryService.findAll(options),
      this.clinicHistoryService.count({ where: options.where }),
    ]);

    return {
      items: histories,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get clinic history by patient' })
  @Get('patient/:type/:id')
  async findByPatient(@Param('type') type: 'donor' | 'receiver', @Param('id') id: string) {
    return this.clinicHistoryService.findByPatient(type, +id);
  }

  @ApiOperation({ summary: 'Get clinic history summary' })
  @Get(':id/summary')
  async getClinicHistorySummary(@Param('id') id: string) {
    return this.clinicHistoryService.getClinicHistorySummary(+id);
  }

  @ApiOperation({ summary: 'Get clinic history by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clinicHistoryService.findOne(+id, ['donor', 'receiver']);
  }

  @ApiOperation({ summary: 'Create new clinic history' })
  @Post()
  async create(@Body() createClinicHistoryDto: CreateClinicHistoryDto) {
    return this.clinicHistoryService.create(createClinicHistoryDto);
  }

  @ApiOperation({ summary: 'Update clinic history' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClinicHistoryDto: UpdateClinicHistoryDto) {
    return this.clinicHistoryService.update(+id, updateClinicHistoryDto);
  }

  @ApiOperation({ summary: 'Update laboratory results' })
  @Put(':id/laboratory-results')
  async updateLaboratoryResults(@Param('id') id: string, @Body() laboratoryResults: any) {
    return this.clinicHistoryService.updateLaboratoryResults(+id, laboratoryResults);
  }

  @ApiOperation({ summary: 'Update imaging results' })
  @Put(':id/imaging-results')
  async updateImagingResults(@Param('id') id: string, @Body() imagingResults: any) {
    return this.clinicHistoryService.updateImagingResults(+id, imagingResults);
  }

  @ApiOperation({ summary: 'Add medical history entry' })
  @Post(':id/medical-history')
  async addMedicalHistoryEntry(@Param('id') id: string, @Body('entry') entry: string) {
    return this.clinicHistoryService.addMedicalHistoryEntry(+id, entry);
  }

  @ApiOperation({ summary: 'Delete clinic history' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clinicHistoryService.remove(+id);
  }
}

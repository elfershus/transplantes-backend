import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransplantProceduresService } from './transplant-procedures.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateTransplantProcedureDto } from './dto/create-transplant-procedure.dto';
import { UpdateTransplantProcedureDto } from './dto/update-transplant-procedure.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('transplant-procedures')
@ApiBearerAuth()
@Controller('transplant-procedures')
@UseGuards(JwtAuthGuard)
export class TransplantProceduresController {
  constructor(
    private readonly transplantProceduresService: TransplantProceduresService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all transplant procedures' })
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
      this.transplantProceduresService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.includeRelations === 'true') {
      options.relations = ['compatibility', 'receiver', 'organ', 'leadDoctor', 'institution'];
    }

    const [procedures, total] = await Promise.all([
      this.transplantProceduresService.findAll(options),
      this.transplantProceduresService.count({ where: options.where }),
    ]);

    return {
      items: procedures,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get upcoming procedures' })
  @Get('upcoming')
  async findUpcoming() {
    return this.transplantProceduresService.findUpcomingProcedures();
  }

  @ApiOperation({ summary: 'Get procedures by doctor' })
  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string) {
    return this.transplantProceduresService.findProceduresByDoctor(+doctorId);
  }

  @ApiOperation({ summary: 'Get procedures by institution' })
  @Get('institution/:institutionId')
  async findByInstitution(@Param('institutionId') institutionId: string) {
    return this.transplantProceduresService.findProceduresByInstitution(+institutionId);
  }

  @ApiOperation({ summary: 'Get procedure statistics' })
  @Get('statistics')
  async getProcedureStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transplantProceduresService.getProcedureStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOperation({ summary: 'Get doctor performance metrics' })
  @Get('doctor/:doctorId/metrics')
  async getDoctorMetrics(@Param('doctorId') doctorId: string) {
    return this.transplantProceduresService.getDoctorPerformanceMetrics(+doctorId);
  }

  @ApiOperation({ summary: 'Get procedure by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.transplantProceduresService.findOne(+id, [
      'compatibility',
      'receiver',
      'organ',
      'leadDoctor',
      'institution',
    ]);
  }

  @ApiOperation({ summary: 'Create new procedure' })
  @Post()
  async create(@Body() createProcedureDto: CreateTransplantProcedureDto) {
    return this.transplantProceduresService.create(createProcedureDto);
  }

  @ApiOperation({ summary: 'Update procedure' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProcedureDto: UpdateTransplantProcedureDto) {
    return this.transplantProceduresService.update(+id, updateProcedureDto);
  }

  @ApiOperation({ summary: 'Delete procedure' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.transplantProceduresService.remove(+id);
  }
}

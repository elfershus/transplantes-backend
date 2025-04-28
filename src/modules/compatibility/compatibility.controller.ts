import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompatibilityService } from './compatibility.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';
import { UpdateCompatibilityDto } from './dto/update-compatibility.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('compatibility')
@ApiBearerAuth()
@Controller('compatibility')
@UseGuards(JwtAuthGuard)
export class CompatibilityController {
  constructor(
    private readonly compatibilityService: CompatibilityService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all compatibility records' })
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
      this.compatibilityService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.includeRelations === 'true') {
      options.relations = ['organ', 'receiver', 'organ.donor'];
    }

    const [compatibilities, total] = await Promise.all([
      this.compatibilityService.findAll(options),
      this.compatibilityService.count({ where: options.where }),
    ]);

    return {
      items: compatibilities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get potential matches for an organ' })
  @Get('organ/:organId/potential')
  async findPotentialMatchesForOrgan(@Param('organId') organId: string) {
    return this.compatibilityService.findPotentialMatchesForOrgan(+organId);
  }

  @ApiOperation({ summary: 'Get potential matches for a receiver' })
  @Get('receiver/:receiverId/potential')
  async findPotentialMatchesForReceiver(@Param('receiverId') receiverId: string) {
    return this.compatibilityService.findPotentialMatchesForReceiver(+receiverId);
  }

  @ApiOperation({ summary: 'Get confirmed matches' })
  @Get('confirmed')
  async findConfirmedMatches() {
    return this.compatibilityService.findConfirmedMatches();
  }

  @ApiOperation({ summary: 'Get matching statistics' })
  @Get('statistics')
  async getMatchingStatistics() {
    return this.compatibilityService.getMatchingStatistics();
  }

  @ApiOperation({ summary: 'Get compatibility record by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.compatibilityService.findOne(+id, ['organ', 'receiver', 'organ.donor']);
  }

  @ApiOperation({ summary: 'Create new compatibility record' })
  @Post()
  async create(@Body() createCompatibilityDto: CreateCompatibilityDto) {
    return this.compatibilityService.create(createCompatibilityDto);
  }

  @ApiOperation({ summary: 'Update compatibility record' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCompatibilityDto: UpdateCompatibilityDto) {
    return this.compatibilityService.update(+id, updateCompatibilityDto);
  }

  @ApiOperation({ summary: 'Delete compatibility record' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.compatibilityService.remove(+id);
  }
}

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReceiversService } from './receivers.service';
import { SearchFilterService } from '../../shared/services/search-filter.service';
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { UpdateReceiverDto } from './dto/update-receiver.dto';
import { SortingOption } from '../../shared/interfaces/sorting.interface';

@ApiTags('receivers')
@ApiBearerAuth()
@Controller('receivers')
@UseGuards(JwtAuthGuard)
export class ReceiversController {
  constructor(
    private readonly receiversService: ReceiversService,
    private readonly searchFilterService: SearchFilterService,
  ) {}

  @ApiOperation({ summary: 'Get all receivers' })
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
      this.receiversService['repository'],
      filters,
      { page, limit },
      sorting,
    );

    if (query.withClinicHistory === 'true') {
      options.relations = ['clinicHistory'];
    }

    const [receivers, total] = await Promise.all([
      this.receiversService.findAll(options),
      this.receiversService.count({ where: options.where }),
    ]);

    return {
      items: receivers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @ApiOperation({ summary: 'Get waiting receivers' })
  @Get('waiting')
  async findWaiting() {
    return this.receiversService.findWaitingReceivers();
  }

  @ApiOperation({ summary: 'Get receivers by urgency level' })
  @Get('urgency/:level')
  async findByUrgencyLevel(@Param('level') level: string) {
    return this.receiversService.findByUrgencyLevel(+level);
  }

  @ApiOperation({ summary: 'Get receivers by blood type' })
  @Get('blood-type/:bloodType')
  async findByBloodType(
    @Param('bloodType') bloodType: string,
    @Query('organType') organType?: string,
  ) {
    return this.receiversService.findByBloodType(bloodType, organType);
  }

  @ApiOperation({ summary: 'Get waitlist statistics' })
  @Get('statistics/waitlist')
  async getWaitlistStatistics() {
    return this.receiversService.getWaitlistStatistics();
  }

  @ApiOperation({ summary: 'Get receiver by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.receiversService.findOne(+id, ['clinicHistory', 'compatibilities']);
  }

  @ApiOperation({ summary: 'Create new receiver' })
  @Post()
  async create(@Body() createReceiverDto: CreateReceiverDto) {
    return this.receiversService.create(createReceiverDto);
  }

  @ApiOperation({ summary: 'Update receiver' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateReceiverDto: UpdateReceiverDto) {
    return this.receiversService.update(+id, updateReceiverDto);
  }

  @ApiOperation({ summary: 'Delete receiver' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.receiversService.remove(+id);
  }
}

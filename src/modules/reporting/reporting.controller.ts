import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('overview')
  async getSystemOverview() {
    return this.reportingService.getSystemOverview();
  }

  @Get('transplants')
  async getTransplantStatistics(
    @Query('startDate', ParseDatePipe) startDate: Date,
    @Query('endDate', ParseDatePipe) endDate: Date,
  ) {
    return this.reportingService.getTransplantStatisticsByPeriod(startDate, endDate);
  }

  @Get('waitlist')
  async getWaitlistStatistics() {
    return this.reportingService.getWaitlistStatistics();
  }

  @Get('matches')
  async getOrganMatchingStatistics() {
    return this.reportingService.getOrganMatchingStatistics();
  }

  @Get('transportation')
  async getTransportationEfficiencyReport() {
    return this.reportingService.getTransportationEfficiencyReport();
  }

  @Get('export')
  async exportReport(
    @Query('type') reportType: string,
    @Query('format') format: 'pdf' | 'csv' | 'excel' = 'pdf',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let parsedStartDate, parsedEndDate;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error('Invalid start date format');
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        throw new Error('Invalid end date format');
      }
    }

    return {
      success: true,
      message: `Export of ${reportType} report in ${format} format has been initiated.`,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';

import { Organ } from '../../shared/entities/organ.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { TransplantProcedure } from '../../shared/entities/transplant-procedure.entity';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Institution } from '../../shared/entities/institution.entity';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Organ)
    private organsRepository: Repository<Organ>,
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
    @InjectRepository(Receiver)
    private receiversRepository: Repository<Receiver>,
    @InjectRepository(TransplantProcedure)
    private proceduresRepository: Repository<TransplantProcedure>,
    @InjectRepository(Transportation)
    private transportationRepository: Repository<Transportation>,
    @InjectRepository(Institution)
    private institutionsRepository: Repository<Institution>,
  ) {}

  async getSystemOverview() {
    const [
      totalDonors,
      activeDonors,
      totalReceivers,
      waitingReceivers,
      totalOrgans,
      availableOrgans,
      totalTransplants,
      successfulTransplants,
      pendingTransportations,
    ] = await Promise.all([
      this.donorsRepository.count(),
      this.donorsRepository.count({ where: { status: 'active' } }),
      this.receiversRepository.count(),
      this.receiversRepository.count({ where: { status: 'waiting' } }),
      this.organsRepository.count(),
      this.organsRepository.count({ where: { status: 'available' } }),
      this.proceduresRepository.count(),
      this.proceduresRepository.count({ where: { outcome: 'successful' } }),
      this.transportationRepository.count({ where: { status: 'in-transit' } }),
    ]);

    return {
      donors: {
        total: totalDonors,
        active: activeDonors,
      },
      receivers: {
        total: totalReceivers,
        waiting: waitingReceivers,
      },
      organs: {
        total: totalOrgans,
        available: availableOrgans,
      },
      transplants: {
        total: totalTransplants,
        successful: successfulTransplants,
      },
      transportations: {
        pending: pendingTransportations,
      },
    };
  }

  async getTransplantStatisticsByPeriod(startDate: Date, endDate: Date) {
    const procedures = await this.proceduresRepository.find({
      where: {
        actualDate: Between(startDate, endDate),
      },
      relations: ['organ', 'leadDoctor', 'institution'],
    });

    const organTypes = {};
    const outcomes = {};
    const institutions = {};

    procedures.forEach((procedure) => {
      // Count by organ type
      const organType = procedure.organ?.type || 'unknown';
      organTypes[organType] = (organTypes[organType] || 0) + 1;

      // Count by outcome
      const outcome = procedure.outcome || 'unknown';
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;

      // Count by institution
      const institution = procedure.institution?.name || 'unknown';
      institutions[institution] = (institutions[institution] || 0) + 1;
    });

    return {
      totalTransplants: procedures.length,
      byOrganType: organTypes,
      byOutcome: outcomes,
      byInstitution: institutions,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  async getWaitlistStatistics() {
    const receivers = await this.receiversRepository.find({
      where: { status: 'waiting' },
      relations: ['clinicHistory'],
    });

    const byBloodType = {};
    const byOrganType = {};
    const byUrgencyLevel = {};
    const byAgeGroup = {};

    receivers.forEach((receiver) => {
      // Count by blood type
      const bloodType = receiver.bloodType || 'unknown';
      byBloodType[bloodType] = (byBloodType[bloodType] || 0) + 1;

      // Determine age group
      const age = this.calculateAge(receiver.dateOfBirth);
      const ageGroup = this.getAgeGroup(age);
      byAgeGroup[ageGroup] = (byAgeGroup[ageGroup] || 0) + 1;

      // Count by urgency level
      const urgencyLevel = receiver.urgencyStatus.toString() || 'unknown';
      byUrgencyLevel[urgencyLevel] = (byUrgencyLevel[urgencyLevel] || 0) + 1;
    });

    return {
      totalWaiting: receivers.length,
      byBloodType,
      byUrgencyLevel,
      byAgeGroup,
    };
  }

  async getOrganMatchingStatistics() {
    // Get available organs
    const organs = await this.organsRepository.find({
      where: { status: 'available' },
      relations: ['compatibilities', 'compatibilities.receiver'],
    });

    const statistics = {
      totalAvailableOrgans: organs.length,
      potentialMatches: 0,
      confirmedMatches: 0,
      byOrganType: {},
      matchingRateByBloodType: {},
    };

    organs.forEach((organ) => {
      const organType = organ.type;

      // Initialize organ type counter
      if (!statistics.byOrganType[organType]) {
        statistics.byOrganType[organType] = {
          total: 0,
          matched: 0,
        };
      }

      statistics.byOrganType[organType].total++;

      // Count matches
      if (organ.compatibilities?.length) {
        const potentialMatches = organ.compatibilities.filter(
          (c) => c.status === 'potential',
        ).length;
        const confirmedMatches = organ.compatibilities.filter(
          (c) => c.status === 'confirmed',
        ).length;

        statistics.potentialMatches += potentialMatches;
        statistics.confirmedMatches += confirmedMatches;

        if (confirmedMatches > 0) {
          statistics.byOrganType[organType].matched++;
        }
      }
    });

    return statistics;
  }

  async getTransportationEfficiencyReport() {
    const transportations = await this.transportationRepository.find({
      where: { actualArrivalTime: Not(IsNull()) },
      relations: ['organ', 'originInstitution', 'destinationInstitution'],
    });

    const report = {
      totalTransports: transportations.length,
      averageTransportTime: 0,
      onTimeDeliveryRate: 0,
      byTransportMethod: {},
      byDistance: {
        short: { count: 0, avgTime: 0 },
        medium: { count: 0, avgTime: 0 },
        long: { count: 0, avgTime: 0 },
      },
    };

    let totalTransportTime = 0;
    let onTimeDeliveries = 0;

    transportations.forEach((transport) => {
      // Calculate transport time in minutes
      const departureTime = new Date(transport.departureTime).getTime();
      const arrivalTime = new Date(transport.actualArrivalTime).getTime();
      const transportTime = (arrivalTime - departureTime) / (1000 * 60); // in minutes

      totalTransportTime += transportTime;

      // Check if delivered on time
      const estimatedArrival = new Date(transport.estimatedArrivalTime).getTime();
      if (arrivalTime <= estimatedArrival) {
        onTimeDeliveries++;
      }

      // Count by transport method
      const method = transport.transportMethod;
      if (!report.byTransportMethod[method]) {
        report.byTransportMethod[method] = {
          count: 0,
          avgTime: 0,
          totalTime: 0,
        };
      }
      report.byTransportMethod[method].count++;
      report.byTransportMethod[method].totalTime += transportTime;
    });

    // Calculate averages
    if (transportations.length > 0) {
      report.averageTransportTime = totalTransportTime / transportations.length;
      report.onTimeDeliveryRate = (onTimeDeliveries / transportations.length) * 100;

      // Calculate averages by transport method
      Object.keys(report.byTransportMethod).forEach((method) => {
        const data = report.byTransportMethod[method];
        data.avgTime = data.totalTime / data.count;
        delete data.totalTime; // Remove the total time from the final report
      });
    }

    return report;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '0-17';
    if (age < 35) return '18-34';
    if (age < 50) return '35-49';
    if (age < 65) return '50-64';
    return '65+';
  }
}

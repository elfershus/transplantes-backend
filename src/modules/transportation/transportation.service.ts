import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Transportation } from '../../shared/entities/transportation.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Institution } from '../../shared/entities/institution.entity';
import { CreateTransportationDto } from './dto/create-transportation.dto';
import { UpdateTransportationDto } from './dto/update-transportation.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class TransportationService extends GenericCrudService<Transportation> {
  constructor(
    @InjectRepository(Transportation)
    protected readonly repository: Repository<Transportation>,
    @InjectRepository(Organ)
    private organRepository: Repository<Organ>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async create(createTransportationDto: CreateTransportationDto): Promise<Transportation> {
    // Verify organ exists and is ready for transport
    const organ = await this.organRepository.findOne({
      where: { id: createTransportationDto.organId },
    });

    if (!organ) {
      throw new NotFoundException(`Organ with ID ${createTransportationDto.organId} not found`);
    }

    if (organ.status !== 'matched' && organ.status !== 'available') {
      throw new BadRequestException(
        `Organ with ID ${createTransportationDto.organId} is not ready for transport`,
      );
    }

    // Verify origin and destination institutions exist
    const [originInstitution, destinationInstitution] = await Promise.all([
      this.institutionRepository.findOne({
        where: { id: createTransportationDto.originInstitutionId },
      }),
      this.institutionRepository.findOne({
        where: { id: createTransportationDto.destinationInstitutionId },
      }),
    ]);

    if (!originInstitution) {
      throw new NotFoundException(
        `Origin institution with ID ${createTransportationDto.originInstitutionId} not found`,
      );
    }

    if (!destinationInstitution) {
      throw new NotFoundException(
        `Destination institution with ID ${createTransportationDto.destinationInstitutionId} not found`,
      );
    }

    // Create transportation record
    const transportation = this.repository.create({
      organ,
      originInstitution,
      destinationInstitution,
      departureTime: createTransportationDto.departureTime,
      estimatedArrivalTime: createTransportationDto.estimatedArrivalTime,
      transportMethod: createTransportationDto.transportMethod,
      transportCompany: createTransportationDto.transportCompany,
      trackingNumber: createTransportationDto.trackingNumber,
      status: createTransportationDto.status || 'scheduled',
    });

    const savedTransportation = await this.repository.save(transportation);

    // Update organ status to in-transit if transportation is starting
    if (transportation.status === 'in-transit') {
      await this.organRepository.update(organ.id, { status: 'in-transit' });
    }

    return this.findOne(savedTransportation.id, [
      'organ',
      'originInstitution',
      'destinationInstitution',
    ]);
  }

  async update(
    id: number,
    updateTransportationDto: UpdateTransportationDto,
  ): Promise<Transportation> {
    const transportation = await this.findOne(id, ['organ']);
    const oldStatus = transportation.status;

    Object.assign(transportation, updateTransportationDto);
    const updatedTransportation = await this.repository.save(transportation);

    // Handle status change events
    if (oldStatus !== updatedTransportation.status) {
      this.eventEmitter.emitTransportationStatusChanged(updatedTransportation, oldStatus);

      // Update organ status based on transportation status
      if (updatedTransportation.status === 'in-transit') {
        await this.organRepository.update(transportation.organ.id, { status: 'in-transit' });
      } else if (updatedTransportation.status === 'delivered') {
        await this.organRepository.update(transportation.organ.id, { status: 'delivered' });
        // Record actual arrival time if not already set
        if (!updatedTransportation.actualArrivalTime) {
          updatedTransportation.actualArrivalTime = new Date();
          await this.repository.save(updatedTransportation);
        }
      }
    }

    return this.findOne(id, ['organ', 'originInstitution', 'destinationInstitution']);
  }

  async findActiveTransports(): Promise<Transportation[]> {
    return this.repository.find({
      where: [{ status: 'scheduled' }, { status: 'in-transit' }],
      relations: ['organ', 'originInstitution', 'destinationInstitution'],
      order: { departureTime: 'ASC' },
    });
  }

  async findDelayedTransports(): Promise<Transportation[]> {
    const now = new Date();
    return this.repository.find({
      where: {
        status: 'in-transit',
        estimatedArrivalTime: Not(IsNull()),
        actualArrivalTime: IsNull(),
      },
      relations: ['organ', 'originInstitution', 'destinationInstitution'],
      order: { estimatedArrivalTime: 'ASC' },
    });
  }

  async getTransportationEfficiencyReport(startDate: Date, endDate: Date): Promise<any> {
    const transportations = await this.repository.find({
      where: {
        actualArrivalTime: Not(IsNull()),
        departureTime: Not(IsNull()),
      },
      relations: ['organ', 'originInstitution', 'destinationInstitution'],
    });

    const report = {
      totalTransports: transportations.length,
      averageTransportTime: 0,
      onTimeDeliveryRate: 0,
      byTransportMethod: {},
      byOrganType: {},
      delayAnalysis: {
        averageDelayMinutes: 0,
        delayReasons: {},
      },
    };

    let totalTransportTime = 0;
    let onTimeDeliveries = 0;
    let totalDelayMinutes = 0;
    let delayedCount = 0;

    transportations.forEach((transport) => {
      // Calculate transport time in minutes
      const transportTime =
        (transport.actualArrivalTime.getTime() - transport.departureTime.getTime()) / (1000 * 60);
      totalTransportTime += transportTime;

      // Check if delivered on time
      if (transport.actualArrivalTime <= transport.estimatedArrivalTime) {
        onTimeDeliveries++;
      } else {
        const delay =
          (transport.actualArrivalTime.getTime() - transport.estimatedArrivalTime.getTime()) /
          (1000 * 60);
        totalDelayMinutes += delay;
        delayedCount++;
      }

      // Count by transport method
      if (!report.byTransportMethod[transport.transportMethod]) {
        report.byTransportMethod[transport.transportMethod] = {
          count: 0,
          avgTime: 0,
          totalTime: 0,
        };
      }
      report.byTransportMethod[transport.transportMethod].count++;
      report.byTransportMethod[transport.transportMethod].totalTime += transportTime;

      // Count by organ type
      if (!report.byOrganType[transport.organ.type]) {
        report.byOrganType[transport.organ.type] = {
          count: 0,
          avgTime: 0,
          totalTime: 0,
        };
      }
      report.byOrganType[transport.organ.type].count++;
      report.byOrganType[transport.organ.type].totalTime += transportTime;
    });

    // Calculate averages
    if (transportations.length > 0) {
      report.averageTransportTime = totalTransportTime / transportations.length;
      report.onTimeDeliveryRate = (onTimeDeliveries / transportations.length) * 100;

      // Calculate averages by transport method
      Object.keys(report.byTransportMethod).forEach((method) => {
        const data = report.byTransportMethod[method];
        data.avgTime = data.totalTime / data.count;
        delete data.totalTime;
      });

      // Calculate averages by organ type
      Object.keys(report.byOrganType).forEach((type) => {
        const data = report.byOrganType[type];
        data.avgTime = data.totalTime / data.count;
        delete data.totalTime;
      });

      // Calculate delay averages
      if (delayedCount > 0) {
        report.delayAnalysis.averageDelayMinutes = totalDelayMinutes / delayedCount;
      }
    }

    return report;
  }

  async getTransportationRouteAnalysis(): Promise<any> {
    const transportations = await this.repository.find({
      relations: ['originInstitution', 'destinationInstitution'],
    });

    const routeAnalysis = {};

    transportations.forEach((transport) => {
      const routeKey = `${transport.originInstitution.name} -> ${transport.destinationInstitution.name}`;

      if (!routeAnalysis[routeKey]) {
        routeAnalysis[routeKey] = {
          count: 0,
          avgTime: 0,
          totalTime: 0,
          successRate: 0,
          successful: 0,
        };
      }

      routeAnalysis[routeKey].count++;

      if (transport.actualArrivalTime && transport.departureTime) {
        const transportTime =
          (transport.actualArrivalTime.getTime() - transport.departureTime.getTime()) / (1000 * 60);
        routeAnalysis[routeKey].totalTime += transportTime;

        if (transport.status === 'delivered') {
          routeAnalysis[routeKey].successful++;
        }
      }
    });

    // Calculate averages
    Object.keys(routeAnalysis).forEach((route) => {
      const data = routeAnalysis[route];
      data.avgTime = data.count > 0 ? data.totalTime / data.count : 0;
      data.successRate = data.count > 0 ? (data.successful / data.count) * 100 : 0;
      delete data.totalTime;
    });

    return routeAnalysis;
  }
}

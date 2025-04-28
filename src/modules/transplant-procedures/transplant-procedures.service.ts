import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TransplantProcedure } from '../../shared/entities/transplant-procedure.entity';
import { Compatibility } from '../../shared/entities/compatibility.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Doctor } from '../../shared/entities/doctor.entity';
import { Institution } from '../../shared/entities/institution.entity';
import { CreateTransplantProcedureDto } from './dto/create-transplant-procedure.dto';
import { UpdateTransplantProcedureDto } from './dto/update-transplant-procedure.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class TransplantProceduresService extends GenericCrudService<TransplantProcedure> {
  constructor(
    @InjectRepository(TransplantProcedure)
    protected readonly repository: Repository<TransplantProcedure>,
    @InjectRepository(Compatibility)
    private compatibilityRepository: Repository<Compatibility>,
    @InjectRepository(Receiver)
    private receiverRepository: Repository<Receiver>,
    @InjectRepository(Organ)
    private organRepository: Repository<Organ>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async create(createProcedureDto: CreateTransplantProcedureDto): Promise<TransplantProcedure> {
    // Fetch all required entities
    const [compatibility, leadDoctor, institution] = await Promise.all([
      this.compatibilityRepository.findOne({
        where: { id: createProcedureDto.compatibilityId },
        relations: ['organ', 'receiver'],
      }),
      this.doctorRepository.findOne({ where: { id: createProcedureDto.leadDoctorId } }),
      this.institutionRepository.findOne({ where: { id: createProcedureDto.institutionId } }),
    ]);

    if (!compatibility) {
      throw new NotFoundException(
        `Compatibility with ID ${createProcedureDto.compatibilityId} not found`,
      );
    }

    if (!leadDoctor) {
      throw new NotFoundException(`Doctor with ID ${createProcedureDto.leadDoctorId} not found`);
    }

    if (!institution) {
      throw new NotFoundException(
        `Institution with ID ${createProcedureDto.institutionId} not found`,
      );
    }

    // Validate compatibility status
    if (compatibility.status !== 'confirmed') {
      throw new BadRequestException(
        `Compatibility must be confirmed before scheduling a procedure`,
      );
    }

    // Create procedure
    const procedure = this.repository.create({
      compatibility,
      receiver: compatibility.receiver,
      organ: compatibility.organ,
      leadDoctor,
      institution,
      scheduledDate: createProcedureDto.scheduledDate,
      notes: createProcedureDto.notes,
      status: 'scheduled',
    });

    const savedProcedure = await this.repository.save(procedure);

    // Emit procedure scheduled event
    this.eventEmitter.emitTransplantScheduled(savedProcedure);

    return this.findOne(savedProcedure.id, [
      'compatibility',
      'receiver',
      'organ',
      'leadDoctor',
      'institution',
    ]);
  }

  async update(
    id: number,
    updateProcedureDto: UpdateTransplantProcedureDto,
  ): Promise<TransplantProcedure> {
    const procedure = await this.findOne(id);

    // If the procedure is being completed, validate required fields
    if (updateProcedureDto.status === 'completed' && !updateProcedureDto.actualDate) {
      updateProcedureDto.actualDate = new Date();
    }

    if (updateProcedureDto.status === 'completed' && !updateProcedureDto.outcome) {
      throw new BadRequestException('Outcome is required when completing a procedure');
    }

    Object.assign(procedure, updateProcedureDto);
    const updatedProcedure = await this.repository.save(procedure);

    // If procedure is completed, update related entities
    if (updatedProcedure.status === 'completed') {
      await Promise.all([
        // Update organ status
        this.organRepository.update(procedure.organ.id, { status: 'transplanted' }),
        // Update receiver status
        this.receiverRepository.update(procedure.receiver.id, { status: 'transplanted' }),
        // Update compatibility status
        this.compatibilityRepository.update(procedure.compatibility.id, { status: 'completed' }),
      ]);

      // Emit procedure completed event
      this.eventEmitter.emitTransplantCompleted(updatedProcedure);
    }

    return this.findOne(id, ['compatibility', 'receiver', 'organ', 'leadDoctor', 'institution']);
  }

  async findUpcomingProcedures(): Promise<TransplantProcedure[]> {
    return this.repository.find({
      where: { status: 'scheduled' },
      relations: ['receiver', 'organ', 'leadDoctor', 'institution'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findProceduresByDoctor(doctorId: number): Promise<TransplantProcedure[]> {
    return this.repository.find({
      where: { leadDoctor: { id: doctorId } },
      relations: ['receiver', 'organ', 'institution'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findProceduresByInstitution(institutionId: number): Promise<TransplantProcedure[]> {
    return this.repository.find({
      where: { institution: { id: institutionId } },
      relations: ['receiver', 'organ', 'leadDoctor'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async getProcedureStatistics(startDate: Date, endDate: Date): Promise<any> {
    const procedures = await this.repository.find({
      where: {
        actualDate: Between(startDate, endDate),
        status: 'completed',
      },
      relations: ['organ', 'leadDoctor', 'institution'],
    });

    const statistics = {
      totalProcedures: procedures.length,
      byOutcome: {},
      byOrganType: {},
      byInstitution: {},
      successRate: 0,
      averageDuration: 0,
    };

    let successfulCount = 0;
    let totalDuration = 0;

    procedures.forEach((procedure) => {
      // Count by outcome
      const outcome = procedure.outcome || 'unknown';
      statistics.byOutcome[outcome] = (statistics.byOutcome[outcome] || 0) + 1;

      if (outcome === 'successful') {
        successfulCount++;
      }

      // Count by organ type
      const organType = procedure.organ.type;
      statistics.byOrganType[organType] = (statistics.byOrganType[organType] || 0) + 1;

      // Count by institution
      const institutionName = procedure.institution.name;
      statistics.byInstitution[institutionName] =
        (statistics.byInstitution[institutionName] || 0) + 1;

      // Calculate duration
      if (procedure.durationMinutes) {
        totalDuration += procedure.durationMinutes;
      }
    });

    // Calculate success rate and average duration
    if (procedures.length > 0) {
      statistics.successRate = (successfulCount / procedures.length) * 100;
      statistics.averageDuration = totalDuration / procedures.length;
    }

    return statistics;
  }

  async getDoctorPerformanceMetrics(doctorId: number): Promise<any> {
    const procedures = await this.repository.find({
      where: { leadDoctor: { id: doctorId }, status: 'completed' },
      relations: ['organ'],
    });

    const metrics = {
      totalProcedures: procedures.length,
      successfulProcedures: 0,
      successRate: 0,
      byOrganType: {},
      averageDuration: 0,
    };

    let totalDuration = 0;

    procedures.forEach((procedure) => {
      if (procedure.outcome === 'successful') {
        metrics.successfulProcedures++;
      }

      const organType = procedure.organ.type;
      if (!metrics.byOrganType[organType]) {
        metrics.byOrganType[organType] = {
          total: 0,
          successful: 0,
        };
      }
      metrics.byOrganType[organType].total++;
      if (procedure.outcome === 'successful') {
        metrics.byOrganType[organType].successful++;
      }

      if (procedure.durationMinutes) {
        totalDuration += procedure.durationMinutes;
      }
    });

    if (procedures.length > 0) {
      metrics.successRate = (metrics.successfulProcedures / procedures.length) * 100;
      metrics.averageDuration = totalDuration / procedures.length;
    }

    return metrics;
  }
}

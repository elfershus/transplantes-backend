import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Organ } from '../../shared/entities/organ.entity';
import { Donor } from '../../shared/entities/donor.entity';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class OrgansService extends GenericCrudService<Organ> {
  constructor(
    @InjectRepository(Organ)
    protected readonly repository: Repository<Organ>,
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async create(createOrganDto: CreateOrganDto): Promise<Organ> {
    // Verify donor exists
    const donor = await this.donorRepository.findOne({
      where: { id: createOrganDto.donorId },
    });

    if (!donor) {
      throw new NotFoundException(`Donor with ID ${createOrganDto.donorId} not found`);
    }

    const organ = this.repository.create({
      ...createOrganDto,
      donor,
    });

    const savedOrgan = await this.repository.save(organ);

    // Emit organ created event
    this.eventEmitter.emitOrganCreated(savedOrgan);

    if (savedOrgan.status === 'available') {
      this.eventEmitter.emitOrganStatusChanged(savedOrgan, 'new');
    }

    return this.findOne(savedOrgan.id, ['donor']);
  }

  async update(id: number, updateOrganDto: UpdateOrganDto): Promise<Organ> {
    const organ = await this.findOne(id, ['donor']);
    const oldStatus = organ.status;

    Object.assign(organ, updateOrganDto);
    const updatedOrgan = await this.repository.save(organ);

    // Emit status change event if status was updated
    if (oldStatus !== updatedOrgan.status) {
      this.eventEmitter.emitOrganStatusChanged(updatedOrgan, oldStatus);
    }

    return this.findOne(id, ['donor']);
  }

  async findAvailableOrgans(): Promise<Organ[]> {
    return this.repository.find({
      where: { status: 'available' },
      relations: ['donor'],
      order: { retrievalDate: 'DESC' },
    });
  }

  async findAvailableOrgansByType(type: string): Promise<Organ[]> {
    return this.repository.find({
      where: { type, status: 'available' },
      relations: ['donor'],
      order: { retrievalDate: 'DESC' },
    });
  }

  async findExpiringOrgans(hours: number = 24): Promise<Organ[]> {
    const expirationThreshold = new Date();
    expirationThreshold.setHours(expirationThreshold.getHours() + hours);

    return this.repository.find({
      where: {
        status: 'available',
        expirationDate: LessThan(expirationThreshold),
      },
      relations: ['donor'],
      order: { expirationDate: 'ASC' },
    });
  }

  async getOrganStatistics(): Promise<any> {
    const [totalOrgans, availableOrgans, matchedOrgans, transplantedOrgans] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { status: 'available' } }),
      this.repository.count({ where: { status: 'matched' } }),
      this.repository.count({ where: { status: 'transplanted' } }),
    ]);

    const organsByType = await this.repository
      .createQueryBuilder('organ')
      .select('organ.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('organ.type')
      .getRawMany();

    const availableByType = await this.repository
      .createQueryBuilder('organ')
      .select('organ.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('organ.status = :status', { status: 'available' })
      .groupBy('organ.type')
      .getRawMany();

    return {
      total: totalOrgans,
      available: availableOrgans,
      matched: matchedOrgans,
      transplanted: transplantedOrgans,
      byType: organsByType,
      availableByType: availableByType,
    };
  }

  async getOrganLifespanStatistics(): Promise<any> {
    const organs = await this.repository.find({
      where: { status: 'transplanted' },
      relations: ['donor', 'transportations'],
    });

    const lifespanStats = {
      byOrganType: {},
      averageLifespan: 0,
      totalOrgans: organs.length,
    };

    let totalLifespan = 0;

    organs.forEach((organ) => {
      if (organ.retrievalDate && organ.expirationDate) {
        const lifespan = Math.floor(
          (organ.expirationDate.getTime() - organ.retrievalDate.getTime()) / (1000 * 60 * 60),
        );

        if (!lifespanStats.byOrganType[organ.type]) {
          lifespanStats.byOrganType[organ.type] = {
            count: 0,
            totalLifespan: 0,
            averageLifespan: 0,
          };
        }

        lifespanStats.byOrganType[organ.type].count++;
        lifespanStats.byOrganType[organ.type].totalLifespan += lifespan;
        totalLifespan += lifespan;
      }
    });

    // Calculate averages
    if (organs.length > 0) {
      lifespanStats.averageLifespan = totalLifespan / organs.length;

      Object.keys(lifespanStats.byOrganType).forEach((type) => {
        const data = lifespanStats.byOrganType[type];
        data.averageLifespan = data.totalLifespan / data.count;
      });
    }

    return lifespanStats;
  }
}

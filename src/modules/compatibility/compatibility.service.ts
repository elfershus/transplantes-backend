import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compatibility } from '../../shared/entities/compatibility.entity';
import { Organ } from '../../shared/entities/organ.entity';
import { Receiver } from '../../shared/entities/receiver.entity';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';
import { UpdateCompatibilityDto } from './dto/update-compatibility.dto';
import { GenericCrudService } from '../../shared/services/generic-crud.service';
import { EventEmitterService } from '../../shared/services/event-emitter.service';

@Injectable()
export class CompatibilityService extends GenericCrudService<Compatibility> {
  constructor(
    @InjectRepository(Compatibility)
    protected readonly repository: Repository<Compatibility>,
    @InjectRepository(Organ)
    private organRepository: Repository<Organ>,
    @InjectRepository(Receiver)
    private receiverRepository: Repository<Receiver>,
    private eventEmitter: EventEmitterService,
  ) {
    super(repository);
  }

  async create(createCompatibilityDto: CreateCompatibilityDto): Promise<Compatibility> {
    // Verify organ exists and is available
    const organ = await this.organRepository.findOne({
      where: { id: createCompatibilityDto.organId },
      relations: ['donor'],
    });

    if (!organ) {
      throw new NotFoundException(`Organ with ID ${createCompatibilityDto.organId} not found`);
    }

    if (organ.status !== 'available') {
      throw new BadRequestException(
        `Organ with ID ${createCompatibilityDto.organId} is not available for matching`,
      );
    }

    // Verify receiver exists and is waiting
    const receiver = await this.receiverRepository.findOne({
      where: { id: createCompatibilityDto.receiverId },
      relations: ['clinicHistory'],
    });

    if (!receiver) {
      throw new NotFoundException(
        `Receiver with ID ${createCompatibilityDto.receiverId} not found`,
      );
    }

    if (receiver.status !== 'waiting') {
      throw new BadRequestException(
        `Receiver with ID ${createCompatibilityDto.receiverId} is not on the waiting list`,
      );
    }

    // Check for existing compatibility
    const existingCompatibility = await this.repository.findOne({
      where: {
        organ: { id: organ.id },
        receiver: { id: receiver.id },
      },
    });

    if (existingCompatibility) {
      throw new BadRequestException(
        'Compatibility record already exists for this organ-receiver pair',
      );
    }

    // Calculate compatibility score if not provided
    let compatibilityScore = createCompatibilityDto.compatibilityScore;
    if (!compatibilityScore) {
      compatibilityScore = await this.calculateCompatibilityScore(organ, receiver);
    }

    const compatibility = this.repository.create({
      organ,
      receiver,
      compatibilityScore,
      matchDate: new Date(),
      notes: createCompatibilityDto.notes,
      status: createCompatibilityDto.status || 'potential',
    });

    const savedCompatibility = await this.repository.save(compatibility);

    // Emit event for compatibility found
    this.eventEmitter.emitCompatibilityFound(savedCompatibility);

    return this.findOne(savedCompatibility.id, ['organ', 'receiver', 'organ.donor']);
  }

  async update(id: number, updateCompatibilityDto: UpdateCompatibilityDto): Promise<Compatibility> {
    const compatibility = await this.findOne(id, ['organ', 'receiver']);
    const oldStatus = compatibility.status;

    Object.assign(compatibility, updateCompatibilityDto);
    const updatedCompatibility = await this.repository.save(compatibility);

    // Emit status change event if status was updated
    if (oldStatus !== updatedCompatibility.status) {
      this.eventEmitter.emitCompatibilityStatusChanged(updatedCompatibility, oldStatus);

      // Update related entities based on status change
      if (updatedCompatibility.status === 'confirmed') {
        // Update organ status to matched
        await this.organRepository.update(compatibility.organ.id, { status: 'matched' });

        // Update receiver status to matched
        await this.receiverRepository.update(compatibility.receiver.id, { status: 'matched' });
      }
    }

    return this.findOne(id, ['organ', 'receiver', 'organ.donor']);
  }

  async calculateCompatibilityScore(organ: Organ, receiver: Receiver): Promise<number> {
    let score = 0;
    const maxScore = 100;

    // Blood type compatibility (40 points)
    if (this.isBloodTypeCompatible(organ.donor.bloodType, receiver.bloodType)) {
      score += 40;
    }

    // HLA matching (30 points)
    if (organ.donor.hlaType && receiver.hlaType) {
      const hlaScore = this.calculateHLAScore(organ.donor.hlaType, receiver.hlaType);
      score += hlaScore * 30;
    }

    // Urgency status (20 points)
    score += (5 - receiver.urgencyStatus) * 4; // Higher urgency gets more points

    // Age compatibility (10 points)
    const ageScore = this.calculateAgeCompatibility(organ.donor.dateOfBirth, receiver.dateOfBirth);
    score += ageScore * 10;

    return Math.min(score, maxScore);
  }

  private isBloodTypeCompatible(donorBloodType: string, receiverBloodType: string): boolean {
    const compatibilityMatrix = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+'],
    };

    return compatibilityMatrix[donorBloodType]?.includes(receiverBloodType) || false;
  }

  private calculateHLAScore(donorHLA: string, receiverHLA: string): number {
    // This is a simplified HLA matching algorithm
    // In reality, HLA matching is more complex
    const donorMarkers = donorHLA.split(',');
    const receiverMarkers = receiverHLA.split(',');
    let matches = 0;

    donorMarkers.forEach((marker) => {
      if (receiverMarkers.includes(marker)) {
        matches++;
      }
    });

    return matches / Math.max(donorMarkers.length, receiverMarkers.length);
  }

  private calculateAgeCompatibility(donorDOB: Date, receiverDOB: Date): number {
    const donorAge = this.calculateAge(donorDOB);
    const receiverAge = this.calculateAge(receiverDOB);
    const ageDifference = Math.abs(donorAge - receiverAge);

    if (ageDifference <= 10) return 1;
    if (ageDifference <= 20) return 0.8;
    if (ageDifference <= 30) return 0.6;
    if (ageDifference <= 40) return 0.4;
    return 0.2;
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

  async findPotentialMatchesForOrgan(organId: number): Promise<Compatibility[]> {
    return this.repository.find({
      where: { organ: { id: organId }, status: 'potential' },
      relations: ['receiver', 'receiver.clinicHistory'],
      order: { compatibilityScore: 'DESC' },
    });
  }

  async findPotentialMatchesForReceiver(receiverId: number): Promise<Compatibility[]> {
    return this.repository.find({
      where: { receiver: { id: receiverId }, status: 'potential' },
      relations: ['organ', 'organ.donor'],
      order: { compatibilityScore: 'DESC' },
    });
  }

  async findConfirmedMatches(): Promise<Compatibility[]> {
    return this.repository.find({
      where: { status: 'confirmed' },
      relations: ['organ', 'receiver', 'organ.donor'],
      order: { matchDate: 'DESC' },
    });
  }

  async getMatchingStatistics(): Promise<any> {
    const [totalMatches, potentialMatches, confirmedMatches, completedMatches] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { status: 'potential' } }),
      this.repository.count({ where: { status: 'confirmed' } }),
      this.repository.count({ where: { status: 'completed' } }),
    ]);

    const averageScores = await this.repository
      .createQueryBuilder('compatibility')
      .select('AVG(compatibility.compatibilityScore)', 'average')
      .addSelect('compatibility.status', 'status')
      .groupBy('compatibility.status')
      .getRawMany();

    return {
      totalMatches,
      potentialMatches,
      confirmedMatches,
      completedMatches,
      averageScoresByStatus: averageScores.reduce((acc, curr) => {
        acc[curr.status] = parseFloat(curr.average);
        return acc;
      }, {}),
    };
  }
}

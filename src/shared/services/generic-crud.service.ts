import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

@Injectable()
export class GenericCrudService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(id: number, relations?: string[]): Promise<T> {
    const options = {
      where: { id } as FindOptionsWhere<T>,
      relations,
    };

    const item = await this.repository.findOne(options);

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async create(createDto: DeepPartial<T>): Promise<T> {
    const newItem = this.repository.create(createDto);
    return this.repository.save(newItem);
  }

  async update(id: number, updateDto: Partial<T>): Promise<T> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.repository.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repository.remove(item);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }
}

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'hashPassword'>> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const user = this.userRepository.create(createUserDto);
    const saved = await this.userRepository.save(user);
    const { hashPassword : _, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Omit<User, 'hashPassword'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ hashPassword: _, ...rest }) => rest);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async seedAdmin(): Promise<void> {
    const count = await this.userRepository.count();
    if (count > 0) return;

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gfly.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const admin = this.userRepository.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    await this.userRepository.save(admin);
  }
}
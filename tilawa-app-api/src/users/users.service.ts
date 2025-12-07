import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserInput {
  email: string;
  name?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

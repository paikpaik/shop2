import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmailModule } from 'src/email/email.module';
import { User } from './entity/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [EmailModule, TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

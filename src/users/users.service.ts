import { AuthService } from './../auth/auth.service';
import { EmailService } from './../email/email.service';
import * as uuid from 'uuid';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserInfo } from './UserInfo';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    private emailService: EmailService,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private authService: AuthService,
  ) {}

  async createUser(name: string, email: string, password: string) {
    const userExist = await this.checkUserExists(email);
    if (userExist) {
      throw new UnprocessableEntityException(
        '해당 이메일로는 가입할 수 없습니다.',
      );
    }
    const signupVerifyToken = uuid.v1();
    await this.saveUser(name, email, password, signupVerifyToken);
    await this.sendMemberJoinEmail(email, signupVerifyToken);
  }

  private async checkUserExists(emailAddress: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { email: emailAddress },
    });
    return user !== null;
  }

  private async saveUser(
    name: string,
    email: string,
    password: string,
    signupVerifyToken: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();
      const user = new User();
      user.name = name;
      user.email = email;
      user.password = password;
      user.signupVerifyToken = signupVerifyToken;
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
    await this.emailService.sendMemberJoinVerification(
      email,
      signupVerifyToken,
    );
  }

  async verifyEmail(signupVerifyToken: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { signupVerifyToken },
    });
    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }
    return this.authService.login({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { email, password },
    });
    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }
    return this.authService.login({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async getUserInfo(userId: number): Promise<UserInfo> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

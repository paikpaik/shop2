import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  InternalServerErrorException,
  Logger,
  LoggerService,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserInfo } from './UserInfo';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<void> {
    this.printLoggerServiceLog(dto);

    const { name, email, password } = dto;
    await this.userService.createUser(name, email, password);
  }

  private printLoggerServiceLog(dto) {
    try {
      throw new InternalServerErrorException('test');
    } catch (error) {
      this.logger.error('error: ' + JSON.stringify(dto), error.stack);
    }
    this.logger.warn('warn: ' + JSON.stringify(dto));
    this.logger.log('log: ' + JSON.stringify(dto));
    this.logger.verbose('verbose: ' + JSON.stringify(dto));
    this.logger.debug('debug: ' + JSON.stringify(dto));
  }

  @Post('/email-verify')
  async verifyEmail(@Query() dto: VerifyEmailDto): Promise<string> {
    const { signupVerifyToken } = dto;
    return await this.userService.verifyEmail(signupVerifyToken);
  }

  @Post('/login')
  async login(@Body() dto: UserLoginDto): Promise<string> {
    const { email, password } = dto;
    return await this.userService.login(email, password);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserInfo(
    @Headers() headers: any,
    @Param('id') userId: number,
  ): Promise<UserInfo> {
    const jwtString = headers.authorization.split('Bearer ')[1];
    this.authService.verify(jwtString);
    return this.userService.getUserInfo(userId);
  }
}

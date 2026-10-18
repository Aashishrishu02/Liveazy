
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Register a normal user
  async createUser(registerUserDto: RegisterUserDto) {
    const { name, email, password } = registerUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _password, ...safeUser } = user;

    return safeUser;
  }

  // Normal user login
  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({
      where: {
        email: email.trim(),
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const access_token = await this.jwtService.signAsync({
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'Login successful',
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  // Separate LIVEAZY admin login
  async adminLogin(email: string, password: string) {
    const adminEmail = this.configService
      .get<string>('ADMIN_EMAIL')
      ?.trim()
      .toLowerCase();

    const adminPassword =
      this.configService.get<string>('ADMIN_LOGIN_PASSWORD');

    // Diagnostic: never print the actual password or secret
    console.log('Admin configuration loaded:', {
      emailLoaded: Boolean(adminEmail),
      passwordLoaded: Boolean(adminPassword),
    });

    if (!adminEmail || !adminPassword) {
      throw new InternalServerErrorException(
        'Admin login configuration is missing on the server.',
      );
    }

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.trim().toLowerCase() !== adminEmail ||
      password !== adminPassword
    ) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const access_token = await this.jwtService.signAsync({
      userId: 0,
      email: adminEmail,
    });

    return {
      message: 'Admin login successful',
      access_token,
      user: {
        id: 0,
        name: 'LIVEAZY Admin',
        email: adminEmail,
        role: 'ADMIN',
      },
    };
  }

  // Google login
  async googleLogin(user: any) {
    let existingUser = await this.prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (!existingUser) {
      existingUser = await this.prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          googleId: user.googleId,
        },
      });
    }

    const access_token = await this.jwtService.signAsync({
      userId: existingUser.id,
      email: existingUser.email,
    });

    return {
      message: 'Google login successful',
      access_token,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      },
    };
  }
}

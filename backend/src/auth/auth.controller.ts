
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Normal user registration
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.createUser(dto);
  }

  // Normal user login — existing route preserved
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.authService.loginUser(dto);
  }

  // Dedicated LIVEAZY admin login
  @Post('admin-login')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          example: 'admin@liveazy.com',
        },
        password: {
          type: 'string',
          example: 'Enter your admin password',
        },
      },
    },
  })
  async adminLogin(
    @Body() body: { email?: string; password?: string },
  ) {
    if (
      typeof body?.email !== 'string' ||
      typeof body?.password !== 'string'
    ) {
      throw new BadRequestException(
        'Email and password are required.',
      );
    }

    return this.authService.adminLogin(
      body.email,
      body.password,
    );
  }

  // Protected profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }

  // Google login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const result = await this.authService.googleLogin(req.user);

    return res.redirect(
      `${process.env.FRONTEND_URL}/?token=${encodeURIComponent(result.access_token)}`,
    );
  }
}

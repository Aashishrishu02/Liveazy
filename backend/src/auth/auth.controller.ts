import { Body,Controller,Post ,Get,Req, Res} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.createUser(registerUserDto);
    }

    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto) {
        return this.authService.loginUser(loginUserDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() req:any) {
        return req.user;
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin(){

    }

    @Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleLoginCallback(
  @Req() req: any,
  @Res() res: Response,
) {
  const result = await this.authService.googleLogin(req.user);

  return res.redirect(
    `${process.env.FRONTEND_URL}/?token=${result.access_token}`,
  );
}

}

import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}
//register karne ke liye function
    async createUser(registerUserDto: RegisterUserDto) {
        const { name, email, password } = registerUserDto;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {name,email,password: hashedPassword},
    
        });

        return user;
    }
    //login karne ke liye function
    async loginUser(loginUserDto: LoginUserDto) {
        const { email, password } = loginUserDto;

        const user = await this.prisma.user.findUnique({ 
            where: { email },
        });
        if(!user){
            return{message:'User not found'};
        }
        const isPasswordValid = await bcrypt.compare(password,user.password!,);//comapre karne ke liye bcrypt ka use kiya hai
        if(!isPasswordValid){
            return{message:'Invalid password'};
        }
        const token = this.jwtService.sign({ userId: user.id, email: user.email });
        return {message:'Login successful',access_token: token, user:{id:user.id,name:user.name,email:user.email,} };
    }
    
    //google login ke liye function
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

  const token = this.jwtService.sign({
    userId: existingUser.id,
    email: existingUser.email,
  });

  return {
    message: 'Google login successful',
    access_token: token,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    },
  };
}
}
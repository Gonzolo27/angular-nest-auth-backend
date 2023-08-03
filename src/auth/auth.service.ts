import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto, LoginDto, UpdateAuthDto, CreateUserDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponse } from './interfaces/login-response.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>,
    private jwtService:JwtService
    ){}

  async create(createUserDto: CreateUserDto): Promise<User> {

    /*const newUser = new this.userModel(createUserDto);
    return newUser.save();*/

    /**
     * 1- Encriptar contraseña
     * 2- Guardar usuario
     * 3- Generar JsonWebToken que va a ser nuestra clave de acceso
     * 4- Manejar errores o excepciones
     */

    try {
      const { password, ...userData} = createUserDto;
      //1- Encriptar contraseña
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      //2- Guardar usuario
      await newUser.save();
      const {password:_, ...user} = newUser.toJSON(); 

      return user;

    } catch(error) {
      //4- Manejar errores o excepciones
      if(error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists`);
      }
      throw new InternalServerErrorException('Something terrible happened');
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse>{
    const user = await this.create(registerUserDto);

    return {
      user: user,
      token: await this.getJsonWebToken({id: user._id})
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    /**
     * User {_id, name, email, roles}
     * Token -> ASDASDA.ASDASDASD.ASDASA
     */
    
    const {email, password} = loginDto;
    const user = await this.userModel.findOne({email});
    if(!user) {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    if(!bcryptjs.compareSync(password, user.password)){
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password:_, ...rest} = user.toJSON();

    return {
      user: rest,
      token: await this.getJsonWebToken({id: user.id})
    }

  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async findUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    const {password, ...rest} = user.toJSON();

    return rest;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async getJsonWebToken(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }
}

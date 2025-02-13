import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TokenService } from '../tokens/token.service';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from '../users/user.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { OtpService } from '../otps/otp.service';
@Module({
    controllers: [ProductController],
    providers: [
        ProductService,
        TokenService,
        PrismaService,
        JwtAuthGuard,
        UserService,
        JwtStrategy,
        BcryptService,
        OtpService,
    ],
})
export class ProductModule {}

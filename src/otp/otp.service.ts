import { Injectable } from '@nestjs/common';
import { generate } from 'otp-generator';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { createTransport } from 'nodemailer';
import { PrismaService } from 'src/prisma.service';
import { Otp, Prisma } from '@prisma/client';

@Injectable()
export class OtpService {
    private readonly twilioClient: Twilio;
    private readonly transporter: any;
    private otpThrottleLimit: number = 1;
    private otpTryDailyLimit: number = 5;

    constructor(
        private readonly configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const smsConfig = this.configService.get('otp.sms.twilio');
        const emailConfig = this.configService.get('otp.email');

        this.twilioClient = new Twilio(smsConfig.accountSid, smsConfig.authToken);

        this.transporter = createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.port === 465,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });
    }

    async sendEmailOtp(email: string): Promise<string> {
        const otp: string = generate(6, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        await this.transporter.sendMail({
            from: this.configService.get('otp.email.from'),
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`,
        });

        return otp;
    }

    async sendSmsOtp(phoneNumber: string): Promise<string> {
        const otp: string = generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false });

        await this.twilioClient.messages.create({
            body: `Your OTP code is ${otp}`,
            from: this.configService.get('otp.sms.twilio.from'),
            to: phoneNumber,
        });

        return otp;
    }

    async verifyOtp(code: string, phoneNumberOrEmail: string): Promise<boolean> {
        return true;
    }

    async saveOtp(data: Prisma.OtpCreateWithoutUserInput, userId: number): Promise<Otp> {
        return this.prisma.otp.create({
            data: {
                ...data,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
    }

    async findOtp(where: Prisma.OtpWhereInput): Promise<Otp | null> {
        return this.prisma.otp.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async checkThrottle(email: string, type: string): Promise<boolean> {
        const foundOtp = await this.prisma.otp.findFirst({
            where: {
                user: {
                    email,
                },
                type,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!foundOtp) return false;
        if ((new Date().getTime() - new Date(foundOtp.createdAt).getTime()) / 60000 < this.otpThrottleLimit)
            return true;

        return false;
    }

    async checkDayLimit(email: string, type: string): Promise<boolean> {
        const foundOtp = await this.prisma.otp.findMany({
            where: {
                user: {
                    email,
                },
                type,
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });
        if (foundOtp.length >= this.otpTryDailyLimit) return true;

        return false;
    }
}

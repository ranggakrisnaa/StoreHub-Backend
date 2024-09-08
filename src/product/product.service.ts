import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
    private readonly bucketName: string = process.env.BUCKET_NAME;
    private readonly baseUrl: string = process.env.BASE_URL_SUPABASE;

    constructor(
        private readonly prisma: PrismaService,
        private readonly supabaseService: SupabaseService,
    ) {}

    async createProduct(createProductDto: CreateProductDto, files: Array<Express.Multer.File>, storeId: number) {
        const foundProductCategory = await this.prisma.productCategory.findFirst({
            where: { id: +createProductDto.productCategoryId },
        });
        if (!foundProductCategory) throw new HttpException('Product Category is not found.', HttpStatus.NOT_FOUND);

        const productData = await this.prisma.product.create({
            data: {
                ...createProductDto,
                quantity: +createProductDto.quantity,
                price: +createProductDto.price,
                storeId,
            },
        });

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const image = files[i];
                const photoUrl = await this.uploadImage(image);

                await this.prisma.productPhoto.create({
                    data: {
                        productId: productData.id,
                        photoUrl,
                    },
                });
            }
        }

        return productData;
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        const supabase = this.supabaseService.getClient();
        const filePath = `${uuidv4()}-${file.originalname}`;

        const { data, error } = await supabase.storage.from(this.bucketName).upload(filePath, file.buffer);
        if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);

        return `${this.baseUrl}${data.path}`;
    }
}

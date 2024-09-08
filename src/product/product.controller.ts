import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Res,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Response } from 'express';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from 'src/response/api-response.dto';

@Controller('v1/products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Post(':storeId')
    async createProduct(
        @Body() createProductDto: CreateProductDto,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Param('storeId') storeId: string,
        @Res() res: Response,
    ) {
        await this.productService.createProduct(createProductDto, files, +storeId);

        return ApiResponse.sendResponse(res, HttpStatus.CREATED, 'Product is created successfully.');
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllProduct() {}

    @UseGuards(JwtAuthGuard)
    @Get(':productId')
    async getDetailProduct() {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Put(':productId')
    async updateProduct() {}

    @UseGuards(JwtAuthGuard)
    @Delete(':productId')
    async deleteProduct() {}
}

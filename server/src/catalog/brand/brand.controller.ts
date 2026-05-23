import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('admin/brands')
@SuperAdminOnly()
export class BrandController {
  constructor(private readonly brands: BrandService) {}

  @Get()
  list(@Query('q') q?: string, @Query('isActive') isActive?: string) {
    return this.brands.list({
      q,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.brands.get(id);
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.brands.remove(id);
  }
}

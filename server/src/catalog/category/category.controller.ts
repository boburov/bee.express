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
} from '@nestjs/common';
import { SuperAdminOnly } from '../../auth/decorators/roles.decorator';
import { CategoryService } from './category.service';
import { AttachAttributeDto } from './dto/attach-attribute.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderDto } from './dto/reorder.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin/categories')
@SuperAdminOnly()
export class CategoryController {
  constructor(private readonly cats: CategoryService) {}

  @Get()
  list() {
    return this.cats.list();
  }

  @Get('tree')
  tree() {
    return this.cats.tree();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cats.get(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.cats.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.cats.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cats.remove(id);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Body() dto: ReorderDto) {
    return this.cats.reorder(dto);
  }

  @Post(':id/attributes')
  attachAttribute(@Param('id') id: string, @Body() dto: AttachAttributeDto) {
    return this.cats.attachAttribute(id, dto);
  }

  @Delete(':id/attributes/:attributeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  detachAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.cats.detachAttribute(id, attributeId);
  }
}

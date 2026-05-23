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
import { AttributeService } from './attribute.service';
import {
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
} from './dto/attribute-value.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Controller('admin/attributes')
@SuperAdminOnly()
export class AttributeController {
  constructor(private readonly attrs: AttributeService) {}

  @Get()
  list() {
    return this.attrs.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.attrs.get(id);
  }

  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attrs.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attrs.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.attrs.remove(id);
  }

  // ─── Values ───

  @Get(':id/values')
  listValues(@Param('id') id: string) {
    return this.attrs.listValues(id);
  }

  @Post(':id/values')
  addValue(@Param('id') id: string, @Body() dto: CreateAttributeValueDto) {
    return this.attrs.addValue(id, dto);
  }

  @Patch(':id/values/:valueId')
  updateValue(
    @Param('id') id: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attrs.updateValue(id, valueId, dto);
  }

  @Delete(':id/values/:valueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeValue(@Param('id') id: string, @Param('valueId') valueId: string) {
    return this.attrs.removeValue(id, valueId);
  }
}

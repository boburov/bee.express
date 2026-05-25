import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { PublicCategoriesService } from './public-categories.service';

@Controller('v1/categories')
@Public()
export class PublicCategoriesController {
  constructor(private readonly categories: PublicCategoriesService) {}

  @Get('tree')
  tree() {
    return this.categories.tree();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categories.getBySlug(slug);
  }
}

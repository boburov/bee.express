import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Authenticated } from '../auth/types';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  // Listing is public — anyone can read reviews on a product.
  @Public()
  @Get()
  list(@Query() query: ListReviewsQueryDto) {
    return this.reviews.list(query);
  }

  // Posting requires auth. Verification (`verified: true`) flips when the
  // orders module ships and dto.orderId is checked.
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReviewDto, @CurrentUser() actor: Authenticated) {
    return this.reviews.create(dto, actor.id);
  }
}

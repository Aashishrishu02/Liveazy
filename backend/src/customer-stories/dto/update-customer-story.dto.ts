import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerStoryDto } from './create-customer-story.dto';

export class UpdateCustomerStoryDto extends PartialType(CreateCustomerStoryDto) {}

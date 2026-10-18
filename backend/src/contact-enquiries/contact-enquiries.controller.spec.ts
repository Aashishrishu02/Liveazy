import { Test, TestingModule } from '@nestjs/testing';
import { ContactEnquiriesController } from './contact-enquiries.controller';

describe('ContactEnquiriesController', () => {
  let controller: ContactEnquiriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactEnquiriesController],
    }).compile();

    controller = module.get<ContactEnquiriesController>(ContactEnquiriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ContactEnquiriesService } from './contact-enquiries.service';

describe('ContactEnquiriesService', () => {
  let service: ContactEnquiriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactEnquiriesService],
    }).compile();

    service = module.get<ContactEnquiriesService>(ContactEnquiriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

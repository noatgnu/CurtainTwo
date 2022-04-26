import { TestBed } from '@angular/core/testing';

import { AnovaService } from './anova.service';

describe('AnovaService', () => {
  let service: AnovaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnovaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

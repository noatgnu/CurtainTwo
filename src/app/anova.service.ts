import { Injectable } from '@angular/core';

// @ts-ignore
import * as anova from 'anova';

// @ts-ignore
import * as jstat from 'jstat';

@Injectable({
  providedIn: 'root'
})
export class AnovaService {

  constructor() { }

  calculateAnova(conditionA: any[], conditionB: any[]) {
    return {f: jstat.anovaftest(conditionA, conditionB)}
  }
}

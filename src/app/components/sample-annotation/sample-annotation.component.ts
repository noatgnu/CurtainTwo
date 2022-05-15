import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-sample-annotation',
  templateUrl: './sample-annotation.component.html',
  styleUrls: ['./sample-annotation.component.scss']
})
export class SampleAnnotationComponent implements OnInit {
  samples: any[] = []
  sampleAnnotation: any = {}
  constructor(private data: DataService, public modal: NgbActiveModal, private settings: SettingsService) {
    for (const s in this.data.sampleMap) {
      if (!this.samples.includes(this.data.sampleMap[s].condition)) {
        this.samples.push(this.data.sampleMap[s].condition)
        if (this.settings.settings.sampleAnnotations[this.data.sampleMap[s].condition]) {
          this.sampleAnnotation[this.data.sampleMap[s].condition] = this.settings.settings.sampleAnnotations[this.data.sampleMap[s].condition].slice()
        } else {
          this.sampleAnnotation[this.data.sampleMap[s].condition] = this.data.sampleMap[s].condition
        }
      }
    }
  }

  ngOnInit(): void {
  }

}

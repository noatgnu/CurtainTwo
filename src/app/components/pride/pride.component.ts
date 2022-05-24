import { Component, OnInit } from '@angular/core';
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-pride',
  templateUrl: './pride.component.html',
  styleUrls: ['./pride.component.scss']
})
export class PrideComponent implements OnInit {


  constructor(public settings: SettingsService, private web: WebService) {

  }

  ngOnInit(): void {
  }

}

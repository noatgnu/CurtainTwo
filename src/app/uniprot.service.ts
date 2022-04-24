import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WebService} from "./web.service";
import {fromCSV} from "data-forge";
import {BehaviorSubject, Subject} from "rxjs";
import {formatCurrency} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class UniprotService {
  run = 0
  public Re = /([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})(-\d+)?/;
  results: Map<string, any> = new Map<string, any>()
  organism = ""
  uniprotParseStatus = new BehaviorSubject<boolean>(false)
  uniprotProgressBar = new Subject<any>()
  accMap: Map<string, string> = new Map<string, string>()
  geneNameToAcc: any = {}
  constructor(private http: HttpClient, private web: WebService) { }
  async UniProtParseGet(accList: string[], goStats: boolean) {
    this.results = new Map<string, any>()
    this.run = 0
    const maxLength = accList.length;
    if (maxLength >0) {
      this.run = Math.floor(maxLength/400)
      if (this.run%400>0) {
        this.run = this.run + 1
      }
      let currentRun = 0
      for (let i = 0; i < maxLength; i += 400) {
        let l: string[];
        if (i + 400 < maxLength) {
          l = accList.slice(i, i + 400);
        } else {
          l = accList.slice(i);
        }
        const options: Map<string, string> = new Map<string, string>([
          ['from', 'ACC,ID'],
          ['to', 'ACC'],
          ['query', l.join(' ')],
          ['format', 'tab'],
          ['columns', 'id,entry name,reviewed,protein names,genes,organism,length,database(RefSeq),organism-id,go-id,go(cellular component),comment(SUBCELLULAR LOCATION),feature(TOPOLOGICAL_DOMAIN),feature(GLYCOSYLATION),comment(MASS SPECTROMETRY),mass,sequence,database(STRING),feature(DOMAIN EXTENT),feature(MODIFIED RESIDUE),comment(FUNCTION)'],
          ['compress', 'no'],
          ['force', 'no'],
          ['sort', 'score'],
          ['desc', ''],
          ['fil', '']
        ]);
        const uniprotUrl = this.web.links.uniprotBASE + this.web.toParamString(options);
        const res = await this.http.get(uniprotUrl, {responseType: "text", observe: "body"}).toPromise()
        if (res) {
          this.processReceivedData(<string>res)
          currentRun ++
          this.uniprotProgressBar.next({value: currentRun * 100/this.run, text: "Processed UniProt Job " + currentRun + "/"+ this.run})
        }
      }
      return true
    } else {
      return true
    }

  }

  processReceivedData(data: string) {
    // @ts-ignore
    const df = fromCSV(data, {delimiter: '\t'});
    const columns = df.getColumnNames()
    const lastColumn = columns[columns.length -1]
    let new_df = df.withSeries("query", df.getSeries(lastColumn).bake()).bake()
    new_df = new_df.dropSeries(lastColumn).bake()
    this.organism = new_df.first()["Organism ID"]
    for (const r of new_df) {
      if (r["Gene names"]) {
        r["Gene names"] = r["Gene names"].replaceAll(" ", ";").toUpperCase()
      }
      if (r["Subcellular location [CC]"]) {
        const ind = r["Subcellular location [CC]"].indexOf("Note=")
        if (ind > -1) {
          r["Subcellular location [CC]"] = r["Subcellular location [CC]"].slice(0, ind)
        }

        const subLoc = []
        for (const s of r["Subcellular location [CC]"].split(/[.;]/g)) {
          if (s !== "") {
            let su = s.replace(/\s*\{.*?\}\s*/g, "")
            su = su.split(": ")
            const a = su[su.length-1].trim()
            if (a !== "") {
              subLoc.push(a.slice())
            }

          }
        }
        r["Subcellular location [CC]"] = subLoc
      }

      if (r["Domain [FT]"]) {
        let domains: any[] = []
        let l: number = 0;
        for (const s of r["Domain [FT]"].split(/;/g)) {
          if (s !== "") {
            if (s.indexOf("DOMAIN") > -1) {
              domains.push({})
              l = domains.length
              for (const match of s.matchAll(/(\d+)/g)) {
                if (!("start" in domains[l-1])) {
                  domains[l-1].start = parseInt(match[0])
                } else {
                  domains[l-1].end = parseInt(match[0])
                }
              }
            } else if (s.indexOf("/note=") > -1) {
              const match = /"(.+)"/.exec(s)
              if (match !== null) {
                domains[l-1].name = match[1]
              }
            }
          }
        }
        r["Domain [FT]"] = domains
      }
      if (r["query"]) {
        const query = r["query"].replace(",", ";")
        for (const q of query.split(";")) {
          this.results.set(q, r)
          if (r["Gene names"] !== "") {
            if (!this.geneNameToAcc[r["Gene names"]]) {
              this.geneNameToAcc[r["Gene names"]] = {}
            }
            this.geneNameToAcc[r["Gene names"]][q] = true
          }
        }
      }
    }
  }

  getUniprotFromPrimary(accession_id: string) {
    if (this.accMap.has(accession_id)) {
      const a = this.accMap.get(accession_id)
      if (a) {
        if (this.results.has(a)) {
          const ac = this.results.get(a)
          if (ac) {
            return ac
          }
        }
      }
    }
    return null
  }
}
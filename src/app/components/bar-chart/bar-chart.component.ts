import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {PlotlyService} from "angular-plotly.js";
import {WebService} from "../../web.service";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit {
  _data: any = {}
  uni: any = {}
  @Input() set data(value: any) {
    this._data = value
    this.title = "<b>" + this._data[this.dataService.rawForm.primaryIDs] + "</b>"
    this.uni = this.uniprot.getUniprotFromPrimary(this._data[this.dataService.rawForm.primaryIDs])
    if (this.uni) {
      if (this.uni["Gene names"] !== "") {
        this.title = "<b>" + this.uni["Gene names"] + "(" + this._data[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
      }
    }
    this.drawBarChart()
    this.graphLayout["title"] = this.title
    this.graphLayoutAverage["title"] = this.title
    this.graphLayoutViolin["title"] = this.title
    this.drawAverageBarChart()
  }
  title = ""
  graphData: any[] = []
  graphLayout: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    annotations: [],
    shapes: [],
    margin: {r: 50, l: 50, b: 100, t: 100}
  }

  graphDataAverage: any[] = []
  graphLayoutAverage: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 40, b: 120, t: 100}
  }

  graphDataViolin: any[] = []
  graphLayoutViolin: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 40, b: 120, t: 100}
  }
  constructor(private web: WebService, public dataService: DataService, private uniprot: UniprotService) {
    this.dataService.finishedProcessingData.subscribe(data => {
      if (data) {

      }
    })
  }

  download(type: string) {
    this.web.downloadPlotlyImage('svg', type+'.svg', this._data[this.dataService.rawForm.primaryIDs]+type).then()
  }

  ngOnInit(): void {
  }
  drawBarChart() {
    const tickvals: string[] = []
    const ticktext: string[] = []
    const graph: any = {}

    this.graphData = []
    const annotations: any[] = []
    const shapes: any[] = []
    let sampleNumber: number = 0
    for (const s in this.dataService.sampleMap) {
      sampleNumber ++
      const condition = this.dataService.sampleMap[s].condition
      if (!graph[condition]) {
        graph[condition] = {
          x: [],
          y: [],
          type: "bar",
          name: condition,
          showlegend: false
        }
      }
      graph[condition].x.push(s)
      graph[condition].y.push(this._data[s])
    }
    let currentSampleNumber: number = 0
    for (const g in graph) {
      const annotationsPosition = currentSampleNumber +  graph[g].x.length/2
      currentSampleNumber = currentSampleNumber + graph[g].x.length
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(graph[g].x.length/2)-1])
      ticktext.push(g)
      if (sampleNumber !== currentSampleNumber) {
        shapes.push({
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: currentSampleNumber/sampleNumber,
          x1: currentSampleNumber/sampleNumber,
          y0: 0,
          y1: 1,
          line: {
            dash: "dash",
          }
        })
      }
    }
    this.graphLayout.shapes = shapes

    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext
  }

  drawAverageBarChart() {
    const tickVals: string[] = []
    const tickText: string[] = []
    const graphData: any[] = []
    const graphViolin: any[] = []
    const graph: any = {}
    let sampleNumber: number = 0
    for (const s in this.dataService.sampleMap) {
      sampleNumber ++
      const condition = this.dataService.sampleMap[s].condition
      if (!graph[condition]) {
        graph[condition] = []
      }
      graph[condition].push(this._data[s])
    }
    for (const g in graph) {
      const box = {
        x: g, y: graph[g],
        type: 'box',
        boxpoints: 'all',
        pointpos: 0,
        jitter: 0.3,
        fillcolor: 'rgba(255,255,255,0)',
        line: {
          color: 'rgba(255,255,255,0)',
        },
        hoveron: 'points',
        marker: {
          color: "#654949",
          opacity: 0.8,
        },
        name: g,
        //visible: visible,
        showlegend: false
      }
      const violinX: any[] = graph[g].map(() => g)
      const violin = {
        type: 'violin',
        x: violinX, y: graph[g], points: "all",
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        name: g,
        showlegend: false,
        spanmode: 'soft'
      }
      graphViolin.push(violin)
      const s = new Series(graph[g])
      const std =  s.std()
      const standardError = std/Math.sqrt(s.count())
      const mean = s.mean()
      graphData.push({
        x: [g], y: [mean],
        type: 'bar',
        mode: 'markers',
        error_y: {
          type: 'data',
          array: [standardError],
          visible: true
        },
        //visible: temp[t].visible,
        showlegend: false
      })
      graphData.push(box)
      tickVals.push(g)
      tickText.push(g)
    }
    this.graphDataAverage = graphData
    this.graphLayoutAverage.xaxis.tickvals = tickVals
    this.graphLayoutAverage.xaxis.ticktext = tickText
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin
  }
}
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { ProductionTopic } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import {
  addAxisLabel,
  clearChart,
  createSvg,
  drawPanelFrame,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

interface ProductionMatrixRenderer {
  data(): ProductionTopic[];
  data(value: ProductionTopic[]): ProductionMatrixRenderer;
  render(host: HTMLElement, tooltip: HTMLElement): void;
}

function trimSvgLabel(label: string, width: number): string {
  const maxCharacters = Math.max(9, Math.floor(width / 7.2));
  if (label.length <= maxCharacters) {
    return label;
  }

  return `${label.slice(0, maxCharacters - 3)}...`;
}

function createProductionMatrixRenderer(): ProductionMatrixRenderer {
  let rows: ProductionTopic[] = [];

  const renderer = {
    data(value?: ProductionTopic[]): ProductionTopic[] | ProductionMatrixRenderer {
      if (!value) {
        return rows;
      }

      rows = value.map((row) => ({ ...row }));
      return renderer;
    },

    render(host: HTMLElement, tooltip: HTMLElement): void {
      clearChart(host);
      hideTooltip(tooltip);

      const size = getChartSize(host, { minHeight: 620, fallbackHeight: 620 });
      const svg = createSvg(host, size, 'Production readiness matrix for D3 roadmap topics');
      const box = { x: 24, y: 44, width: size.width - 48, height: size.height - 88 };
      const compact = size.width < 760;
      const margin = {
        top: 54,
        right: compact ? 22 : 120,
        bottom: 52,
        left: compact ? 128 : 196,
      };
      const width = box.width - margin.left - margin.right;
      const height = box.height - margin.top - margin.bottom;
      const color = d3
        .scaleOrdinal<ProductionTopic['status'], string>()
        .domain(['Implemented', 'Patterned', 'Ready'])
        .range(['#0f766e', '#7c3aed', '#f97316']);

      drawPanelFrame(svg, box, 'Production and integration coverage');

      const group = svg.append('g').attr('transform', `translate(${box.x + margin.left},${box.y + margin.top})`);
      const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
      const y = d3
        .scaleBand()
        .domain(rows.map((row) => row.topic))
        .range([0, height])
        .padding(0.22);

      group
        .append('g')
        .attr('stroke', '#e2e8f0')
        .selectAll('line')
        .data(x.ticks(5))
        .join('line')
        .attr('x1', (tick) => x(tick))
        .attr('x2', (tick) => x(tick))
        .attr('y1', 0)
        .attr('y2', height);

      group
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat((tick) => `${tick}%`))
        .call((axis) => axis.select('.domain').attr('stroke', '#cbd5e1'))
        .call((axis) => axis.selectAll('line').attr('stroke', '#d8e0ea'))
        .call((axis) => axis.selectAll('text').attr('fill', '#64748b'));

      group
        .append('g')
        .call(d3.axisLeft(y).tickSize(0).tickFormat((topic) => trimSvgLabel(String(topic), margin.left - 26)))
        .call((axis) => axis.select('.domain').remove())
        .call((axis) => axis.selectAll('text').attr('fill', '#334155').attr('font-weight', 800));

      const areaLabels = svg
        .append('g')
        .attr('transform', `translate(${box.x + 18},${box.y + margin.top})`)
        .selectAll<SVGTextElement, ProductionTopic>('text')
        .data(rows)
        .join('text')
        .attr('x', 0)
        .attr('y', (row) => (y(row.topic) ?? 0) + y.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', 10)
        .attr('font-weight', 900)
        .text((row) => row.area);

      const bars = group
        .append('g')
        .selectAll<SVGRectElement, ProductionTopic>('rect')
        .data(rows)
        .join('rect')
        .attr('x', 0)
        .attr('y', (row) => y(row.topic) ?? 0)
        .attr('width', 0)
        .attr('height', y.bandwidth())
        .attr('rx', 6)
        .attr('fill', (row) => color(row.status))
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, row) => showTooltip(tooltip, host, event, row.topic, row.detail))
        .on('mousemove', (event) => moveTooltip(tooltip, host, event))
        .on('mouseleave', () => hideTooltip(tooltip));

      bars
        .transition()
        .duration(620)
        .ease(d3.easeCubicOut)
        .attr('width', (row) => x(row.score));

      group
        .append('g')
        .selectAll<SVGTextElement, ProductionTopic>('text.score')
        .data(rows)
        .join('text')
        .attr('class', 'score')
        .attr('x', (row) => Math.min(width - 34, x(row.score) + 8))
        .attr('y', (row) => (y(row.topic) ?? 0) + y.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#334155')
        .attr('font-size', 11)
        .attr('font-weight', 900)
        .text((row) => `${row.score}%`);

      const legend = svg.append('g').attr('transform', `translate(${box.x + box.width - margin.right + 18},${box.y + 64})`);
      const legendItems = legend
        .selectAll<SVGGElement, ProductionTopic['status']>('g')
        .data(color.domain())
        .join('g')
        .attr('transform', (_, index) => `translate(0,${index * 23})`);
      legendItems.append('rect').attr('width', 11).attr('height', 11).attr('rx', 3).attr('fill', (status) => color(status));
      legendItems
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('fill', '#334155')
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .text((status) => status);

      areaLabels.raise();
      addAxisLabel(svg, box.x + margin.left + width / 2, box.y + box.height - 16, 'Readiness score');
    },
  } as ProductionMatrixRenderer;

  return renderer;
}

@Component({
  selector: 'app-production-matrix-chart',
  standalone: true,
  templateUrl: './production-matrix-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionMatrixChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly renderer = createProductionMatrixRenderer();
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.renderer.data(dataService.getProductionTopics());
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.chartHost.nativeElement);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['refreshKey']) {
      window.requestAnimationFrame(() => this.render());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  printChart(): void {
    window.print();
  }

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    this.renderer.render(this.chartHost.nativeElement, this.tooltip.nativeElement);
  }
}

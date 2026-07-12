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
import { TreeDatum } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import {
  clearChart,
  createSvg,
  fitLabel,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

@Component({
  selector: 'app-treemap-chart',
  standalone: true,
  templateUrl: './treemap-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreemapChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    private readonly dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {}

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

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    clearChart(host);
    hideTooltip(tooltip);

    const size = getChartSize(host);
    const margin = { top: 42, right: 20, bottom: 24, left: 20 };
    const svg = createSvg(host, size, 'Animated treemap of D3 skills');
    const innerWidth = size.width - margin.left - margin.right;
    const innerHeight = size.height - margin.top - margin.bottom;
    const color = d3
      .scaleOrdinal<string>()
      .domain(['Shapes', 'Layouts', 'Motion', 'Color'])
      .range(['#0f766e', '#f97316', '#7c3aed', '#2563eb']);

    const root = d3
      .treemap<TreeDatum>()
      .size([innerWidth, innerHeight])
      .paddingOuter(8)
      .paddingInner(4)
      .round(true)(
        d3
          .hierarchy<TreeDatum>(this.dataService.getTreeData())
          .sum((datum) => datum.value ?? 0)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
      );

    const group = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const detail = svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 24)
      .attr('fill', '#334155')
      .attr('font-size', 13)
      .attr('font-weight', 800)
      .text('Select a rectangle to inspect a skill area');

    const leaves = root.leaves();
    const cell = group
      .selectAll<SVGGElement, d3.HierarchyRectangularNode<TreeDatum>>('g')
      .data(leaves)
      .join('g')
      .attr('transform', (datum) => `translate(${datum.x0},${datum.y0})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', (datum) => `${datum.data.name}, ${datum.value} practice points`)
      .style('cursor', 'pointer');

    const selectCell = (target: SVGGElement, datum: d3.HierarchyRectangularNode<TreeDatum>): void => {
      cell.selectAll('rect').attr('stroke', '#ffffff').attr('stroke-width', 1.5);
      d3.select(target).select('rect').attr('stroke', '#111827').attr('stroke-width', 3);
      detail.text(`${datum.parent?.data.name ?? 'Skill'} · ${datum.data.name}: ${datum.value} practice points`);
    };

    cell
      .on('click', (event, datum) => selectCell(event.currentTarget as SVGGElement, datum))
      .on('keydown', (event, datum) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        selectCell(event.currentTarget as SVGGElement, datum);
      })
      .on('mouseenter', (event, datum) =>
        showTooltip(
          tooltip,
          host,
          event,
          String(datum.data.name),
          `${datum.parent?.data.name ?? 'D3'} layout area · ${datum.value} points`,
        ),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    cell
      .append('rect')
      .attr('width', (datum) => Math.max(0, datum.x1 - datum.x0))
      .attr('height', (datum) => Math.max(0, datum.y1 - datum.y0))
      .attr('rx', 7)
      .attr('fill', (datum) => color(String(datum.parent?.data.name ?? 'Shapes')))
      .attr('fill-opacity', 0)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .transition()
      .delay((_, index) => index * 40)
      .duration(520)
      .ease(d3.easeCubicOut)
      .attr('fill-opacity', 0.88);

    cell
      .append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#ffffff')
      .attr('font-size', 12)
      .attr('font-weight', 800)
      .text((datum) => fitLabel(String(datum.data.name), datum.x1 - datum.x0));

    cell
      .append('text')
      .attr('x', 10)
      .attr('y', 39)
      .attr('fill', 'rgba(255,255,255,0.82)')
      .attr('font-size', 11)
      .text((datum) => `${datum.value} pts`);
  }
}

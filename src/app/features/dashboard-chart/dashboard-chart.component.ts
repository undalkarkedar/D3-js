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
import {
  DashboardMonth,
  RegionalGeoCollection,
  RegionDatum,
  RegionId,
} from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import { ChartBox, SvgSelection } from '../../shared/d3/d3-chart.types';
import {
  clearChart,
  createSvg,
  drawPanelFrame,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  templateUrl: './dashboard-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly regions: RegionDatum[];
  private readonly months: DashboardMonth[];
  private readonly geoData: RegionalGeoCollection;
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  constructor(
    dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.regions = dataService.getRegions();
    this.months = dataService.getDashboardMonths();
    this.geoData = dataService.getRegionalGeoData();
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

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    clearChart(host);
    hideTooltip(tooltip);

    const size = getChartSize(host, { minHeight: 620, fallbackHeight: 620 });
    const svg = createSvg(host, size, 'Choropleth dashboard with brush filtering');
    const compact = size.width < 760;
    const gutter = 22;
    const mapBox = compact
      ? { x: 18, y: 34, width: size.width - 36, height: Math.round(size.height * 0.34) }
      : { x: 24, y: 46, width: Math.round(size.width * 0.43), height: size.height - 96 };
    const lineBox = compact
      ? {
          x: 18,
          y: mapBox.y + mapBox.height + gutter,
          width: size.width - 36,
          height: Math.round(size.height * 0.25),
        }
      : {
          x: mapBox.x + mapBox.width + gutter,
          y: 46,
          width: size.width - mapBox.width - gutter - 48,
          height: Math.round((size.height - 116) / 2),
        };
    const barBox = compact
      ? {
          x: 18,
          y: lineBox.y + lineBox.height + gutter,
          width: size.width - 36,
          height: size.height - lineBox.y - lineBox.height - gutter - 24,
        }
      : {
          x: lineBox.x,
          y: lineBox.y + lineBox.height + gutter,
          width: lineBox.width,
          height: size.height - lineBox.y - lineBox.height - gutter - 50,
        };

    drawPanelFrame(svg, mapBox, 'Latest regional adoption');
    drawPanelFrame(svg, lineBox, 'Portfolio trend');
    drawPanelFrame(svg, barBox, 'Brush-filtered region bars');
    this.drawChoropleth(svg, mapBox);
    this.drawTrendAndBars(svg, lineBox, barBox);
  }

  private drawChoropleth(svg: SvgSelection, box: ChartBox): void {
    const latest = this.months[this.months.length - 1];
    if (!latest) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const latestById = new Map(this.regions.map((region) => [region.id, latest[region.id]]));
    const values = Array.from(latestById.values());
    const min = d3.min(values) ?? 0;
    const max = d3.max(values) ?? 100;
    const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([min, max]);
    const projection = d3
      .geoMercator()
      .fitSize([box.width - 38, box.height - 78], this.geoData as d3.GeoPermissibleObjects);
    const path = d3.geoPath(projection);
    const group = svg.append('g').attr('transform', `translate(${box.x + 19},${box.y + 42})`);

    group
      .selectAll('path')
      .data(this.geoData.features)
      .join('path')
      .attr('d', (feature) => path(feature as d3.GeoPermissibleObjects))
      .attr('fill', (feature) => color(latestById.get(feature.properties.id) ?? 0))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .on('mouseenter', (event, feature) => {
        const id = feature.properties.id;
        showTooltip(tooltip, host, event, feature.properties.name, `${latestById.get(id) ?? 0}% latest adoption`);
      })
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    const legendWidth = Math.min(190, box.width - 58);
    const legend = svg.append('g').attr('transform', `translate(${box.x + 26},${box.y + box.height - 28})`);
    const gradientId = 'choroplethGradient';
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    d3.range(0, 1.01, 0.1).forEach((step) => {
      gradient
        .append('stop')
        .attr('offset', `${step * 100}%`)
        .attr('stop-color', color(min + step * (max - min)));
    });

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', 8)
      .attr('rx', 4)
      .attr('fill', `url(#${gradientId})`);
    legend
      .append('text')
      .attr('y', -7)
      .attr('fill', '#64748b')
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .text('Adoption intensity');
  }

  private drawTrendAndBars(svg: SvgSelection, lineBox: ChartBox, barBox: ChartBox): void {
    const series = this.months.map((month) => ({
      date: month.month,
      value: d3.mean(this.regions, (region) => month[region.id]) ?? 0,
    }));
    const extent = d3.extent(series, (datum) => datum.date);
    if (!extent[0] || !extent[1]) {
      return;
    }

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const lineMargin = { top: 34, right: 18, bottom: 32, left: 42 };
    const lineWidth = lineBox.width - lineMargin.left - lineMargin.right;
    const lineHeight = lineBox.height - lineMargin.top - lineMargin.bottom;
    const lineGroup = svg
      .append('g')
      .attr('transform', `translate(${lineBox.x + lineMargin.left},${lineBox.y + lineMargin.top})`);
    const x = d3.scaleTime().domain([extent[0], extent[1]]).range([0, lineWidth]);
    const y = d3.scaleLinear().domain([0, 100]).range([lineHeight, 0]);
    const line = d3
      .line<(typeof series)[number]>()
      .x((datum) => x(datum.date))
      .y((datum) => y(datum.value))
      .curve(d3.curveMonotoneX);

    lineGroup
      .append('g')
      .attr('transform', `translate(0,${lineHeight})`)
      .call(d3.axisBottom<Date>(x).ticks(4).tickFormat(d3.timeFormat('%b')))
      .call((group) => group.select('.domain').attr('stroke', '#cbd5e1'))
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));
    lineGroup
      .append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((datum) => `${datum}%`))
      .call((group) => group.select('.domain').remove())
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));

    lineGroup
      .append('path')
      .datum(series)
      .attr('fill', 'none')
      .attr('stroke', '#7c3aed')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    lineGroup
      .selectAll('circle')
      .data(series)
      .join('circle')
      .attr('cx', (datum) => x(datum.date))
      .attr('cy', (datum) => y(datum.value))
      .attr('r', 4)
      .attr('fill', '#7c3aed')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .on('mouseenter', (event, datum) =>
        showTooltip(tooltip, host, event, d3.timeFormat('%B')(datum.date), `${Math.round(datum.value)}% average adoption`),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    const status = svg
      .append('text')
      .attr('x', barBox.x + 18)
      .attr('y', barBox.y + 31)
      .attr('fill', '#64748b')
      .attr('font-size', 11)
      .attr('font-weight', 800)
      .text('Showing all months');

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [lineWidth, lineHeight],
      ])
      .on('brush end', (event) => {
        const selection = event.selection as [number, number] | null;
        if (!selection) {
          updateBars();
          status.text('Showing all months');
          return;
        }

        const [start, end] = selection.map((position) => x.invert(position)) as [Date, Date];
        updateBars([start, end]);
        status.text(`${d3.timeFormat('%b')(start)} through ${d3.timeFormat('%b')(end)}`);
      });

    lineGroup.append('g').attr('class', 'dashboard-brush').call(brush);

    const barMargin = { top: 46, right: 24, bottom: 28, left: 86 };
    const barWidth = barBox.width - barMargin.left - barMargin.right;
    const barHeight = barBox.height - barMargin.top - barMargin.bottom;
    const barGroup = svg
      .append('g')
      .attr('transform', `translate(${barBox.x + barMargin.left},${barBox.y + barMargin.top})`);
    const xBar = d3.scaleLinear().domain([0, 100]).range([0, barWidth]);
    const yBar = d3
      .scaleBand()
      .domain(this.regions.map((region) => region.name))
      .range([0, barHeight])
      .padding(0.24);

    barGroup
      .append('g')
      .attr('transform', `translate(0,${barHeight})`)
      .call(d3.axisBottom(xBar).ticks(4).tickFormat((datum) => `${datum}%`))
      .call((group) => group.select('.domain').attr('stroke', '#cbd5e1'))
      .call((group) => group.selectAll('line').attr('stroke', '#d8e0ea'))
      .call((group) => group.selectAll('text').attr('fill', '#64748b'));
    barGroup
      .append('g')
      .call(d3.axisLeft(yBar).tickSize(0))
      .call((group) => group.select('.domain').remove())
      .call((group) => group.selectAll('text').attr('fill', '#334155').attr('font-weight', 700));

    const updateBars = (range?: [Date, Date]): void => {
      const rows = range
        ? this.months.filter((row) => row.month >= range[0] && row.month <= range[1])
        : this.months;
      const source = rows.length ? rows : this.months;
      const data = this.regions.map((region) => ({
        ...region,
        value: Math.round(d3.mean(source, (row) => row[region.id as RegionId]) ?? region.value),
      }));

      barGroup
        .selectAll<SVGRectElement, RegionDatum>('rect')
        .data(data, (datum) => datum.id)
        .join((enter) =>
          enter
            .append('rect')
            .attr('x', 0)
            .attr('y', (datum) => yBar(datum.name) ?? 0)
            .attr('height', yBar.bandwidth())
            .attr('rx', 6)
            .attr('width', 0)
            .attr('fill', '#f97316'),
        )
        .on('mouseenter', (event, datum) => showTooltip(tooltip, host, event, datum.name, `${datum.value}% filtered adoption`))
        .on('mousemove', (event) => moveTooltip(tooltip, host, event))
        .on('mouseleave', () => hideTooltip(tooltip))
        .transition()
        .duration(320)
        .attr('y', (datum) => yBar(datum.name) ?? 0)
        .attr('height', yBar.bandwidth())
        .attr('width', (datum) => xBar(datum.value));

      barGroup
        .selectAll<SVGTextElement, RegionDatum>('text.value-label')
        .data(data, (datum) => datum.id)
        .join('text')
        .attr('class', 'value-label')
        .attr('y', (datum) => (yBar(datum.name) ?? 0) + yBar.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#334155')
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .transition()
        .duration(320)
        .attr('x', (datum) => xBar(datum.value) + 7)
        .text((datum) => `${datum.value}%`);
    };

    updateBars();
  }
}

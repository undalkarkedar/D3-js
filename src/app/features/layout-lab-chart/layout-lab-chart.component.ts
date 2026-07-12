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
import { ForceLinkDatum, ForceNodeDatum, TreeDatum } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import { ChartBox, SvgSelection } from '../../shared/d3/d3-chart.types';
import {
  clearChart,
  createSvg,
  drawPanelFrame,
  fitLabel,
  getChartSize,
  hideTooltip,
  moveTooltip,
  showTooltip,
} from '../../shared/d3/d3-chart.utils';

type SimulationNode = ForceNodeDatum & d3.SimulationNodeDatum;
type SimulationLink = d3.SimulationLinkDatum<SimulationNode> & ForceLinkDatum;

@Component({
  selector: 'app-layout-lab-chart',
  standalone: true,
  templateUrl: './layout-lab-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutLabChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() refreshKey = 0;
  @ViewChild('chartHost', { static: true }) private chartHost!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef<HTMLDivElement>;

  private readonly nodes: ForceNodeDatum[];
  private readonly links: ForceLinkDatum[];
  private readonly treeData: TreeDatum;
  private resizeObserver?: ResizeObserver;
  private simulation?: d3.Simulation<SimulationNode, SimulationLink>;
  private viewReady = false;

  constructor(
    dataService: RoadmapDataService,
    private readonly zone: NgZone,
  ) {
    this.nodes = dataService.getForceNodes();
    this.links = dataService.getForceLinks();
    this.treeData = dataService.getLayoutTreeData();
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
    this.simulation?.stop();
  }

  private render(): void {
    if (!this.viewReady) {
      return;
    }

    this.simulation?.stop();

    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    clearChart(host);
    hideTooltip(tooltip);

    const size = getChartSize(host, { minHeight: 660, fallbackHeight: 660 });
    const svg = createSvg(host, size, 'Force, pack, and tree layout lab');
    const compact = size.width < 840;
    const gutter = 20;
    const forceBox = compact
      ? { x: 18, y: 34, width: size.width - 36, height: Math.round(size.height * 0.38) }
      : { x: 24, y: 44, width: Math.round((size.width - 70) * 0.48), height: size.height - 88 };
    const packBox = compact
      ? {
          x: 18,
          y: forceBox.y + forceBox.height + gutter,
          width: size.width - 36,
          height: Math.round(size.height * 0.27),
        }
      : {
          x: forceBox.x + forceBox.width + gutter,
          y: 44,
          width: size.width - forceBox.width - gutter - 48,
          height: Math.round((size.height - 108) * 0.47),
        };
    const treeBox = compact
      ? {
          x: 18,
          y: packBox.y + packBox.height + gutter,
          width: size.width - 36,
          height: size.height - packBox.y - packBox.height - gutter - 24,
        }
      : {
          x: packBox.x,
          y: packBox.y + packBox.height + gutter,
          width: packBox.width,
          height: size.height - packBox.y - packBox.height - gutter - 44,
        };

    drawPanelFrame(svg, forceBox, 'Force simulation');
    drawPanelFrame(svg, packBox, 'Pack layout');
    drawPanelFrame(svg, treeBox, 'Tree layout');
    this.drawForce(svg, forceBox);
    this.drawPack(svg, packBox);
    this.drawTree(svg, treeBox);
  }

  private drawForce(svg: SvgSelection, box: ChartBox): void {
    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const nodes: SimulationNode[] = this.nodes.map((node) => ({ ...node }));
    const links: SimulationLink[] = this.links.map((link) => ({ ...link }));
    const color = d3
      .scaleOrdinal<string, string>()
      .domain(['Core', 'Charts', 'Layouts', 'Advanced'])
      .range(['#0f766e', '#f97316', '#7c3aed', '#2563eb']);
    const group = svg.append('g').attr('transform', `translate(${box.x + 18},${box.y + 42})`);
    const width = box.width - 36;
    const height = box.height - 62;
    const linkSelection = group
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.6)
      .selectAll<SVGLineElement, SimulationLink>('line')
      .data(links)
      .join('line')
      .attr('stroke-opacity', (link) => 0.32 + link.strength * 0.38);
    const nodeSelection = group
      .append('g')
      .selectAll<SVGCircleElement, SimulationNode>('circle')
      .data(nodes, (node) => node.id)
      .join('circle')
      .attr('r', (node) => node.radius)
      .attr('fill', (node) => color(node.group))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('cursor', 'grab')
      .on('mouseenter', (event, node) => showTooltip(tooltip, host, event, node.id, `${node.group} layout node`))
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));
    const labelSelection = group
      .append('g')
      .selectAll<SVGTextElement, SimulationNode>('text')
      .data(nodes, (node) => node.id)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#111827')
      .attr('font-size', 10)
      .attr('font-weight', 900)
      .attr('pointer-events', 'none')
      .text((node) => fitLabel(node.id, node.radius * 5));

    const endpointX = (endpoint: string | number | SimulationNode | undefined): number =>
      typeof endpoint === 'object' ? endpoint.x ?? width / 2 : width / 2;
    const endpointY = (endpoint: string | number | SimulationNode | undefined): number =>
      typeof endpoint === 'object' ? endpoint.y ?? height / 2 : height / 2;

    this.simulation = d3
      .forceSimulation<SimulationNode, SimulationLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id((node) => node.id)
          .distance(82)
          .strength((link) => link.strength),
      )
      .force('charge', d3.forceManyBody<SimulationNode>().strength(-185))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimulationNode>().radius((node) => node.radius + 5))
      .on('tick', () => {
        linkSelection
          .attr('x1', (link) => endpointX(link.source))
          .attr('y1', (link) => endpointY(link.source))
          .attr('x2', (link) => endpointX(link.target))
          .attr('y2', (link) => endpointY(link.target));
        nodeSelection.attr('cx', (node) => node.x ?? 0).attr('cy', (node) => node.y ?? 0);
        labelSelection.attr('x', (node) => node.x ?? 0).attr('y', (node) => node.y ?? 0);
      });

    const drag = d3
      .drag<SVGCircleElement, SimulationNode>()
      .on('start', (event, node) => {
        if (!event.active) {
          this.simulation?.alphaTarget(0.3).restart();
        }
        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event, node) => {
        node.fx = Math.max(node.radius, Math.min(width - node.radius, event.x));
        node.fy = Math.max(node.radius, Math.min(height - node.radius, event.y));
      })
      .on('end', (event, node) => {
        if (!event.active) {
          this.simulation?.alphaTarget(0);
        }
        node.fx = undefined;
        node.fy = undefined;
      });

    nodeSelection.call(drag);
  }

  private drawPack(svg: SvgSelection, box: ChartBox): void {
    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const width = box.width - 42;
    const height = box.height - 58;
    const group = svg.append('g').attr('transform', `translate(${box.x + 21},${box.y + 44})`);
    const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 3]);
    const root = d3
      .pack<TreeDatum>()
      .size([width, height])
      .padding(5)(
        d3
          .hierarchy(this.treeData)
          .sum((datum) => datum.value ?? 0)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
      );

    const nodes = root.descendants().slice(1);
    group
      .selectAll<SVGCircleElement, d3.HierarchyCircularNode<TreeDatum>>('circle')
      .data(nodes)
      .join('circle')
      .attr('cx', (node) => node.x)
      .attr('cy', (node) => node.y)
      .attr('r', 0)
      .attr('fill', (node) => color(node.depth))
      .attr('fill-opacity', (node) => (node.children ? 0.28 : 0.82))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, node) =>
        showTooltip(tooltip, host, event, node.data.name, `${node.value ?? 0} hierarchy points`),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip))
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('r', (node) => node.r);

    group
      .selectAll<SVGTextElement, d3.HierarchyCircularNode<TreeDatum>>('text')
      .data(nodes.filter((node) => !node.children && node.r > 12))
      .join('text')
      .attr('x', (node) => node.x)
      .attr('y', (node) => node.y + 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', 10)
      .attr('font-weight', 900)
      .text((node) => fitLabel(node.data.name, node.r * 2));
  }

  private drawTree(svg: SvgSelection, box: ChartBox): void {
    const host = this.chartHost.nativeElement;
    const tooltip = this.tooltip.nativeElement;
    const margin = { top: 36, right: 20, bottom: 16, left: 20 };
    const width = box.width - margin.left - margin.right;
    const height = box.height - margin.top - margin.bottom;
    const group = svg.append('g').attr('transform', `translate(${box.x + margin.left},${box.y + margin.top})`);
    const root = d3
      .tree<TreeDatum>()
      .size([height, width - 24])(
        d3.hierarchy(this.treeData).sum((datum) => datum.value ?? 0),
      );
    const linkPath = (link: d3.HierarchyPointLink<TreeDatum>): string => {
      const mid = (link.source.y + link.target.y) / 2;
      return `M${link.source.y},${link.source.x}C${mid},${link.source.x} ${mid},${link.target.x} ${link.target.y},${link.target.x}`;
    };

    group
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.7)
      .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeDatum>>('path')
      .data(root.links())
      .join('path')
      .attr('d', linkPath);

    const node = group
      .append('g')
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeDatum>>('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (datum) => `translate(${datum.y},${datum.x})`)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, datum) =>
        showTooltip(tooltip, host, event, datum.data.name, `${datum.value ?? 0} tree points`),
      )
      .on('mousemove', (event) => moveTooltip(tooltip, host, event))
      .on('mouseleave', () => hideTooltip(tooltip));

    node
      .append('circle')
      .attr('r', (datum) => (datum.children ? 7 : 5))
      .attr('fill', (datum) => (datum.children ? '#f97316' : '#0f766e'))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);
    node
      .append('text')
      .attr('x', (datum) => (datum.children ? -11 : 10))
      .attr('dy', 4)
      .attr('text-anchor', (datum) => (datum.children ? 'end' : 'start'))
      .attr('fill', '#334155')
      .attr('font-size', 10)
      .attr('font-weight', 800)
      .text((datum) => fitLabel(datum.data.name, 86));
  }
}

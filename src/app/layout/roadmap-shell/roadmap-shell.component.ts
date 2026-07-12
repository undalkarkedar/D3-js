import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DashboardChartComponent } from '../../features/dashboard-chart/dashboard-chart.component';
import { BarChartComponent } from '../../features/bar-chart/bar-chart.component';
import { LayoutLabChartComponent } from '../../features/layout-lab-chart/layout-lab-chart.component';
import { LineChartComponent } from '../../features/line-chart/line-chart.component';
import { ProductionMatrixChartComponent } from '../../features/production-matrix-chart/production-matrix-chart.component';
import { ShapeStudioChartComponent } from '../../features/shape-studio-chart/shape-studio-chart.component';
import { TreemapChartComponent } from '../../features/treemap-chart/treemap-chart.component';
import { ZoomRealtimeChartComponent } from '../../features/zoom-realtime-chart/zoom-realtime-chart.component';
import { Project, ProjectKey } from '../../core/models/roadmap.models';
import { RoadmapDataService } from '../../core/services/roadmap-data.service';
import { ProjectBriefComponent } from '../project-brief/project-brief.component';
import { ProjectSummaryComponent } from '../project-summary/project-summary.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-roadmap-shell',
  standalone: true,
  imports: [
    CommonModule,
    BarChartComponent,
    DashboardChartComponent,
    LayoutLabChartComponent,
    LineChartComponent,
    ProductionMatrixChartComponent,
    ProjectBriefComponent,
    ProjectSummaryComponent,
    ShapeStudioChartComponent,
    SidebarComponent,
    TreemapChartComponent,
    ZoomRealtimeChartComponent,
  ],
  templateUrl: './roadmap-shell.component.html',
  styleUrl: './roadmap-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapShellComponent {
  private readonly dataService = inject(RoadmapDataService);

  readonly projects: Project[] = this.dataService.projects;
  activeKey: ProjectKey = 'bar';
  refreshKey = 0;

  get activeProject(): Project {
    return this.dataService.getProject(this.activeKey);
  }

  selectProject(projectKey: ProjectKey): void {
    this.activeKey = projectKey;
    this.refreshKey += 1;
  }

  refreshChart(): void {
    this.refreshKey += 1;
  }
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Project } from '../../core/models/roadmap.models';

@Component({
  selector: 'app-project-summary',
  standalone: true,
  templateUrl: './project-summary.component.html',
  styleUrl: './project-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryComponent {
  @Input({ required: true }) project!: Project;
}

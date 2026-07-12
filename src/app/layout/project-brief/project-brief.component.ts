import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Project } from '../../core/models/roadmap.models';

@Component({
  selector: 'app-project-brief',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-brief.component.html',
  styleUrl: './project-brief.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBriefComponent {
  @Input({ required: true }) project!: Project;

  trackText(_: number, value: string): string {
    return value;
  }
}

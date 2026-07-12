import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Project, ProjectKey } from '../../core/models/roadmap.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input({ required: true }) projects: Project[] = [];
  @Input({ required: true }) activeKey: ProjectKey = 'bar';
  @Output() readonly projectSelected = new EventEmitter<ProjectKey>();

  trackProject(_: number, project: Project): ProjectKey {
    return project.key;
  }
}

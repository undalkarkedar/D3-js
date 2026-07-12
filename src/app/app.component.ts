import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoadmapShellComponent } from './layout/roadmap-shell/roadmap-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RoadmapShellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}

import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { ROADMAP_PROJECTS } from '../data/roadmap-projects.data';
import {
  BAR_DATA_CSV,
  DASHBOARD_MONTHS,
  FORCE_LINKS,
  FORCE_NODES,
  LAYOUT_TREE_DATA,
  LINE_DATA,
  PRODUCTION_TOPICS,
  REGIONAL_GEO_DATA,
  REGIONS,
  SHAPE_SEGMENTS,
  STACKED_TOPIC_DATA,
  TREE_DATA,
} from '../data/visualization.data';
import {
  BarDatum,
  DashboardMonth,
  ForceLinkDatum,
  ForceNodeDatum,
  LineDatum,
  Project,
  ProjectKey,
  ProductionTopic,
  RegionalGeoCollection,
  RegionDatum,
  ShapeDatum,
  StackedTopicDatum,
  TreeDatum,
} from '../models/roadmap.models';

@Injectable({ providedIn: 'root' })
export class RoadmapDataService {
  readonly projects: Project[] = ROADMAP_PROJECTS;

  getProject(projectKey: ProjectKey): Project {
    return this.projects.find((project) => project.key === projectKey) ?? this.projects[0];
  }

  getLineData(): LineDatum[] {
    return [...LINE_DATA];
  }

  getTreeData(): TreeDatum {
    return structuredClone(TREE_DATA);
  }

  getShapeSegments(): ShapeDatum[] {
    return [...SHAPE_SEGMENTS];
  }

  getStackedTopicData(): StackedTopicDatum[] {
    return [...STACKED_TOPIC_DATA];
  }

  getForceNodes(): ForceNodeDatum[] {
    return FORCE_NODES.map((node) => ({ ...node }));
  }

  getForceLinks(): ForceLinkDatum[] {
    return FORCE_LINKS.map((link) => ({ ...link }));
  }

  getLayoutTreeData(): TreeDatum {
    return structuredClone(LAYOUT_TREE_DATA);
  }

  getRegions(): RegionDatum[] {
    return [...REGIONS];
  }

  getDashboardMonths(): DashboardMonth[] {
    return [...DASHBOARD_MONTHS];
  }

  getRegionalGeoData(): RegionalGeoCollection {
    return structuredClone(REGIONAL_GEO_DATA);
  }

  getProductionTopics(): ProductionTopic[] {
    return PRODUCTION_TOPICS.map((topic) => ({ ...topic }));
  }

  getFallbackBarData(): BarDatum[] {
    return this.parseBarDataCsv(BAR_DATA_CSV);
  }

  async loadBarData(): Promise<BarDatum[]> {
    return this.getFallbackBarData();
  }

  private parseBarDataCsv(csvValue: string): BarDatum[] {
    const data = d3.csvParse(csvValue, (row) => ({
      topic: row['topic'] ?? '',
      hours: Number(row['hours']),
      phase: row['phase'] ?? '',
    }));
    return data.filter((row) => row.topic && Number.isFinite(row.hours));
  }
}

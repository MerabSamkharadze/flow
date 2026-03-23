import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Task } from '../../models/task.model';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A single point on the chart */
interface ChartPoint {
  x: number; // SVG x coordinate
  y: number; // SVG y coordinate
}

/** Velocity stats computed from task data */
export interface BurndownStats {
  totalTasks: number;
  completedTasks: number;
  completedPercent: number;
  remainingTasks: number;
  avgPerDay: number;
  estimatedCompletion: string | null;
}

/**
 * BurndownChartComponent — pure SVG burndown chart with velocity stats.
 *
 * Shows ideal vs actual burndown lines, today marker, area fill,
 * and computed velocity statistics below the chart.
 */
@Component({
  standalone: false,
  selector: 'app-burndown-chart',
  templateUrl: './burndown-chart.component.html',
  styleUrls: ['./burndown-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BurndownChartComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() startDate!: Date;
  @Input() endDate!: Date;

  // SVG dimensions
  readonly width = 800;
  readonly height = 300;
  readonly padLeft = 50;
  readonly padRight = 20;
  readonly padTop = 20;
  readonly padBottom = 40;

  idealPath = '';
  actualPath = '';
  areaPath = '';
  todayX: number | null = null;
  hasData = false;
  stats: BurndownStats = {
    totalTasks: 0,
    completedTasks: 0,
    completedPercent: 0,
    remainingTasks: 0,
    avgPerDay: 0,
    estimatedCompletion: null,
  };

  // Grid and axis labels
  yLabels: { y: number; label: string }[] = [];
  xLabels: { x: number; label: string }[] = [];
  gridLines: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tasks && this.startDate && this.endDate) {
      this.compute();
    }
  }

  private compute(): void {
    const total = this.tasks.length;
    if (total === 0) {
      this.hasData = false;
      this.resetStats();
      return;
    }

    const start = this.startDate.getTime();
    const end = this.endDate.getTime();
    const now = Date.now();
    const totalDays = Math.max(1, Math.ceil((end - start) / DAY_MS));

    const chartW = this.width - this.padLeft - this.padRight;
    const chartH = this.height - this.padTop - this.padBottom;

    // Check if we have any completedAt data
    const completedTasks = this.tasks.filter((t) => t.status === 'done' && t.completedAt);
    this.hasData = completedTasks.length > 0;

    // --- Ideal line: straight from (start, total) to (end, 0) ---
    const idealStart: ChartPoint = { x: this.padLeft, y: this.padTop };
    const idealEnd: ChartPoint = { x: this.padLeft + chartW, y: this.padTop + chartH };
    this.idealPath = `M${idealStart.x},${idealStart.y} L${idealEnd.x},${idealEnd.y}`;

    // --- Actual line: remaining tasks per day ---
    // Build a map of completions per day-offset
    const completionsPerDay = new Map<number, number>();
    for (const task of completedTasks) {
      if (!task.completedAt) continue;
      const dayOffset = Math.floor((task.completedAt - start) / DAY_MS);
      const clamped = Math.max(0, Math.min(dayOffset, totalDays));
      completionsPerDay.set(clamped, (completionsPerDay.get(clamped) || 0) + 1);
    }

    // Build actual data points day by day (up to today or end)
    const todayDay = Math.min(Math.floor((now - start) / DAY_MS), totalDays);
    const actualPoints: ChartPoint[] = [];
    let remaining = total;

    for (let d = 0; d <= todayDay; d++) {
      const x = this.padLeft + (d / totalDays) * chartW;
      const y = this.padTop + (1 - remaining / total) * chartH;
      actualPoints.push({ x, y });
      remaining -= completionsPerDay.get(d) || 0;
    }
    // Final point at current day
    const lastX = this.padLeft + (todayDay / totalDays) * chartW;
    const lastY = this.padTop + (1 - remaining / total) * chartH;
    actualPoints.push({ x: lastX, y: lastY });

    if (this.hasData && actualPoints.length > 1) {
      this.actualPath = actualPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');

      // Area fill path — close to bottom
      this.areaPath =
        this.actualPath +
        ` L${lastX.toFixed(1)},${(this.padTop + chartH).toFixed(1)}` +
        ` L${this.padLeft},${(this.padTop + chartH).toFixed(1)} Z`;
    } else {
      this.actualPath = '';
      this.areaPath = '';
    }

    // --- Today marker ---
    if (now >= start && now <= end) {
      this.todayX = this.padLeft + ((now - start) / (end - start)) * chartW;
    } else {
      this.todayX = null;
    }

    // --- Y-axis labels + grid ---
    this.yLabels = [];
    this.gridLines = [];
    const steps = Math.min(5, total);
    for (let i = 0; i <= steps; i++) {
      const val = Math.round((total / steps) * (steps - i));
      const y = this.padTop + (i / steps) * chartH;
      this.yLabels.push({ y, label: String(val) });
      if (i > 0 && i < steps) {
        this.gridLines.push(y);
      }
    }

    // --- X-axis labels (monthly ticks) ---
    this.xLabels = [];
    const d = new Date(start);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    while (d.getTime() < end) {
      const x = this.padLeft + ((d.getTime() - start) / (end - start)) * chartW;
      this.xLabels.push({
        x,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
      d.setMonth(d.getMonth() + 1);
    }

    // --- Compute stats ---
    const completed = this.tasks.filter((t) => t.status === 'done').length;
    const remainingNow = total - completed;
    const elapsedDays = Math.max(1, Math.ceil((now - start) / DAY_MS));
    const avgPerDay = completed / elapsedDays;

    let estCompletion: string | null = null;
    if (avgPerDay > 0 && remainingNow > 0) {
      const daysLeft = Math.ceil(remainingNow / avgPerDay);
      const estDate = new Date(now + daysLeft * DAY_MS);
      estCompletion = estDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else if (remainingNow === 0) {
      estCompletion = 'Done';
    }

    this.stats = {
      totalTasks: total,
      completedTasks: completed,
      completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      remainingTasks: remainingNow,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      estimatedCompletion: estCompletion,
    };
  }

  private resetStats(): void {
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      completedPercent: 0,
      remainingTasks: 0,
      avgPerDay: 0,
      estimatedCompletion: null,
    };
    this.idealPath = '';
    this.actualPath = '';
    this.areaPath = '';
    this.todayX = null;
    this.yLabels = [];
    this.xLabels = [];
    this.gridLines = [];
  }
}

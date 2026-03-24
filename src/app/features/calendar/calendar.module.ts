import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CalendarRoutingModule } from './calendar-routing.module';
import { TasksModule } from '../tasks/tasks.module';

import { CalendarPageComponent } from './pages/calendar-page/calendar-page.component';

@NgModule({
  declarations: [
    CalendarPageComponent,
  ],
  imports: [
    SharedModule,
    CalendarRoutingModule,
    TasksModule,
  ],
})
export class CalendarModule {}

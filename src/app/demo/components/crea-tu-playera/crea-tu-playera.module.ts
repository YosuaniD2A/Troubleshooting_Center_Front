import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreaTuPlayeraRoutingModule } from './crea-tu-playera-routing.module';
import { CreaTuPlayeraComponent } from './crea-tu-playera.component';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';


@NgModule({
    imports: [
        CommonModule,
        CreaTuPlayeraRoutingModule,
        ToolbarModule,
        TableModule
    ],
    declarations: [CreaTuPlayeraComponent]
})
export class CreaTuPlayeraModule { }
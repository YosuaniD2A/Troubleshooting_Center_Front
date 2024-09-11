import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreaTuPlayeraRoutingModule } from './crea-tu-playera-routing.module';
import { CreaTuPlayeraComponent } from './crea-tu-playera.component';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';


@NgModule({
    imports: [
        CommonModule,
        CreaTuPlayeraRoutingModule,
        ToolbarModule,
        TableModule,
        ButtonModule,
        ToastModule
    ],
    declarations: [CreaTuPlayeraComponent]
})
export class CreaTuPlayeraModule { }
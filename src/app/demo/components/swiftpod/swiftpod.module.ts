import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiftpodRoutingModule } from './swiftpod-routing.module';
import { SwiftpodComponent } from './swiftpod.component';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';


@NgModule({
    imports: [
        CommonModule,
        SwiftpodRoutingModule,
        ToolbarModule,
        TableModule
    ],
    declarations: [SwiftpodComponent]
})
export class SwiftpodModule { }
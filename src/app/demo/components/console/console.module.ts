import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsoleRoutingModule } from './console-routing.module';
import { ConsoleComponent } from './console.component';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { EditOrderComponent } from './edit-order/edit-order.component';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';


@NgModule({
    imports: [
        CommonModule,
        ConsoleRoutingModule,
        FormsModule,
        ToolbarModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        DropdownModule
        
    ],
    declarations: [ConsoleComponent, EditOrderComponent]
})
export class ConsoleModule { }
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
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ReplaceRaw } from '../../pipes/replace-raw.pipe';
import { CheckboxModule } from 'primeng/checkbox';


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
        DropdownModule,
        ToastModule,
        InputSwitchModule,
        CheckboxModule
    ],
    declarations: [ConsoleComponent, EditOrderComponent, ReplaceRaw]
})
export class ConsoleModule { }
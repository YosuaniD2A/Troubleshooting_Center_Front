import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingGeneratorComponent } from './listing-generator.component';
import { ListingGeneratorRoutingModule } from './listing-generator-routing.module';

//Primeng Modules
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';

@NgModule({
  declarations: [ListingGeneratorComponent],
  imports: [
    CommonModule,
    ListingGeneratorRoutingModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    DividerModule,
    InputSwitchModule,
    ProgressBarModule,
    ToastModule,
    SkeletonModule,
    TableModule,
    InputTextModule,
    InputTextareaModule,
    MultiSelectModule
  ]
})
export class ListingGeneratorModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoGeneratorComponent } from './info-generator.component';
import { InfoGeneratorRoutingModule } from './info-generator-routing.module';

//Primeng Modules
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { HttpClientModule } from '@angular/common/http';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormsModule } from '@angular/forms';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';

@NgModule({
  declarations: [InfoGeneratorComponent],
  imports: [
    CommonModule,
    InfoGeneratorRoutingModule,
    ToolbarModule,
    TableModule,
    ToastModule,
    FileUploadModule,
    ButtonModule,
    BadgeModule,
    HttpClientModule,
    ProgressBarModule,
    DropdownModule,
    RadioButtonModule,
    InputNumberModule,
    InputTextModule,
    InputTextareaModule,
    SplitButtonModule,
    FormsModule,
    MultiSelectModule,
    DialogModule
  ]
})
export class InfoGeneratorModule { }

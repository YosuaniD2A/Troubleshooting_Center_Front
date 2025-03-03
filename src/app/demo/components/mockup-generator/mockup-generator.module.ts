import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockupGeneratorComponent } from './mockup-generator.component';
import { MockupGeneratorRoutingModule } from './mockup-generator-routing.module';

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
import { FormsModule } from '@angular/forms';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MultiSelectModule } from 'primeng/multiselect';

@NgModule({
  declarations: [MockupGeneratorComponent],
  imports: [
    CommonModule,
    MockupGeneratorRoutingModule,
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
    SplitButtonModule,
    FormsModule,
    MultiSelectModule
  ]
})
export class MockupGeneratorModule { }

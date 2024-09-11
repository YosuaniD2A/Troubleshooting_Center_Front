import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadPtosRoutingModule } from './upload-ptos-routing.module';
import { UploadPtosComponent } from './upload-ptos.component';
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
import { FormsModule } from '@angular/forms';


@NgModule({
    imports: [
        CommonModule,
        UploadPtosRoutingModule,
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
        FormsModule
    ],
    declarations: [UploadPtosComponent]
})
export class UploadPtosModule { }
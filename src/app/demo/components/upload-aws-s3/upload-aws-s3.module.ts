import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadAWSS3RoutingModule } from './upload-aws-s3-routing.module';
import { UploadAWSS3Component } from './upload-aws-s3.component';
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
        UploadAWSS3RoutingModule,
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
    declarations: [UploadAWSS3Component]
})
export class UploadAWSS3Module { }
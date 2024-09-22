import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UploadAWSS3Component } from './upload-aws-s3.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: UploadAWSS3Component }
    ])],
    exports: [RouterModule]
})
export class UploadAWSS3RoutingModule { }
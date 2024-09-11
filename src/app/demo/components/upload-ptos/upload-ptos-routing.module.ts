import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UploadPtosComponent } from './upload-ptos.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: UploadPtosComponent }
    ])],
    exports: [RouterModule]
})
export class UploadPtosRoutingModule { }
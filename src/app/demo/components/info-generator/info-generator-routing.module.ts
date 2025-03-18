import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InfoGeneratorComponent } from './info-generator.component';
import { uploadGuard } from '../../guards/upload.guard';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: InfoGeneratorComponent, canDeactivate: [uploadGuard] }
    ])],
    exports: [RouterModule]
})
export class InfoGeneratorRoutingModule { }
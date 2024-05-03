import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiftpodComponent } from './swiftpod.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: SwiftpodComponent }
    ])],
    exports: [RouterModule]
})
export class SwiftpodRoutingModule { }
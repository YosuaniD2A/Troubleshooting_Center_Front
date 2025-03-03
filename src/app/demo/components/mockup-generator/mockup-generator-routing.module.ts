import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MockupGeneratorComponent } from './mockup-generator.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: MockupGeneratorComponent }
    ])],
    exports: [RouterModule]
})
export class MockupGeneratorRoutingModule { }
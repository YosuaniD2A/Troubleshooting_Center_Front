import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ListingGeneratorComponent } from './listing-generator.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ListingGeneratorComponent }
    ])],
    exports: [RouterModule]
})
export class ListingGeneratorRoutingModule { }
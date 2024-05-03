import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CreaTuPlayeraComponent } from './crea-tu-playera.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: CreaTuPlayeraComponent }
    ])],
    exports: [RouterModule]
})
export class CreaTuPlayeraRoutingModule { }
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConsoleComponent } from './console.component';
import { EditOrderComponent } from './edit-order/edit-order.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ConsoleComponent },
        { path: 'edit-order', component: EditOrderComponent }
    ])],
    exports: [RouterModule]
})
export class ConsoleRoutingModule { }
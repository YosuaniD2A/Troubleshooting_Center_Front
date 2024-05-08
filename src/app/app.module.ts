import { ModuleWithProviders, NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { ProductService } from './demo/service/product.service';
import { CountryService } from './demo/service/country.service';
import { CustomerService } from './demo/service/customer.service';
import { EventService } from './demo/service/event.service';
import { IconService } from './demo/service/icon.service';
import { NodeService } from './demo/service/node.service';
import { PhotoService } from './demo/service/photo.service';
import { DateFromStringPipe } from './demo/pipes/date-from-string.pipe';
import { FormsModule } from '@angular/forms';
//import { AgmCoreModule } from '@agm/core';
import { environment } from 'src/environments/environment';
import { ReplaceRaw } from './demo/pipes/replace-raw.pipe';

@NgModule({
    declarations: [
        AppComponent, NotfoundComponent, DateFromStringPipe
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        FormsModule,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        CountryService, CustomerService, EventService, IconService, NodeService,
        PhotoService, ProductService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

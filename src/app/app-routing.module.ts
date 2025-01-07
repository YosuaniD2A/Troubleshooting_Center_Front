import { RouterModule } from '@angular/router';
import { NgModule, inject } from '@angular/core';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { AppLayoutComponent } from "./layout/app.layout.component";
import { uploadGuard } from './demo/guards/upload.guard';

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: '', component: AppLayoutComponent,
                children: [
                    { path: '', loadChildren: () => import('./demo/components/dashboard/dashboard.module').then(m => m.DashboardModule) },
                    { path: 'console', loadChildren: () => import('./demo/components/console/console.module').then(m => m.ConsoleModule) },
                    { path: 'shutterstock', loadChildren: () => import('./demo/components/shutterstock/shutterstock.module').then(m => m.ShutterstockModule) },
                    { path: 'crea-tu-playera', loadChildren: () => import('./demo/components/crea-tu-playera/crea-tu-playera.module').then(m => m.CreaTuPlayeraModule) },
                    { path: 'broken-images', loadChildren: () => import('./demo/components/broken-images/broken-images.module').then(m => m.BrokenImagesModule) },
                    { path: 'upload-ptos', loadChildren: () => import('./demo/components/upload-ptos/upload-ptos.module').then(m => m.UploadPtosModule) },
                    { path: 'upload-aws-s3', loadChildren: () => import('./demo/components/upload-aws-s3/upload-aws-s3.module').then(m => m.UploadAWSS3Module) },
                    { path: 'shipping-address', loadChildren: () => import('./demo/components/shipping-address/shipping-address.module').then(m => m.ShippingAddressModule) },
                    { path: 'sales-reports', loadChildren: () => import('./demo/components/sales-reports/sales-reports.module').then(m => m.SalesReportsModule) },
                    { path: 'scalablepress', loadChildren: () => import('./demo/components/scalablepress/scalablepress.module').then(m => m.ScalablepressModule) },
                    { path: 'listing-generator', loadChildren: () => import('./demo/components/listing-generator/listing-generator.module').then(m => m.ListingGeneratorModule) },
                    { path: 'uikit', loadChildren: () => import('./demo/components/uikit/uikit.module').then(m => m.UIkitModule) },
                    { path: 'utilities', loadChildren: () => import('./demo/components/utilities/utilities.module').then(m => m.UtilitiesModule) },
                    { path: 'documentation', loadChildren: () => import('./demo/components/documentation/documentation.module').then(m => m.DocumentationModule) },
                    { path: 'blocks', loadChildren: () => import('./demo/components/primeblocks/primeblocks.module').then(m => m.PrimeBlocksModule) },
                    { path: 'pages', loadChildren: () => import('./demo/components/pages/pages.module').then(m => m.PagesModule) },
                ]
            },
            { path: 'auth', loadChildren: () => import('./demo/components/auth/auth.module').then(m => m.AuthModule) },
            { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },
            { path: 'notfound', component: NotfoundComponent },
            { path: '**', redirectTo: '/notfound' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}

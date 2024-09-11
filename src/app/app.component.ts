import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { CreaTuPlayeraService } from './demo/service/crea-tu-playera.service';
import { ThePrintbarService } from './demo/service/the-printbar.service';
import { SwiftpodService } from './demo/service/swift.service';
import { OrderUpdateService } from './demo/service/order-update.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    ctpOrders: any[] = [];
    tpbOrders: any[] = [];
    swiftpodOrders: any[] = [];

    constructor(
        private primengConfig: PrimeNGConfig,
        private creaTuPlayerService: CreaTuPlayeraService,
        private thePrintbarService: ThePrintbarService,
        private swiftPodService: SwiftpodService,
        private orderUpdate: OrderUpdateService
    ) {}

    ngOnInit() {
        this.primengConfig.ripple = true;

        setInterval(() => {
            this.orderUpdate.startPeriodicUpdates(
                this.ctpOrders,
                this.creaTuPlayerService,
                this.swiftpodOrders,
                this.swiftPodService,
                this.tpbOrders,
                this.thePrintbarService
            );
            console.log('Se ejecuto desde App');
            
        }, 900000); // Ejecutar cada 15 minuto (ajusta el tiempo según tus necesidades)
        
    }

    async getCTPOrders() {
        const result = await this.creaTuPlayerService.getCTPOrders();
        if (result.data.length > 0) {
            this.ctpOrders = result.data.map((order) => {
                const modifiedOrder = {
                    ...order,
                    date: order.date.split('T')[0],
                    status_name: this.statusName(order.status.toString()),
                };
                return modifiedOrder;
            });
        }
    }

    async getSwiftPODOrders() {
        const result = await this.swiftPodService.getSwiftPODOrder();
        if (result.data.length > 0) {
            this.swiftpodOrders = result.data.map((order) => {
                const modifiedOrder = {
                    ...order,
                    date_status: order.date.split('T')[0],
                    date_shipment: order.ship_date
                        ? order.ship_date.split('T')[0]
                        : '',
                };
                return modifiedOrder;
            });
        }
    }

    async getTPBOrders() {
        const result = await this.thePrintbarService.getAllOrdersUnshipped();

        if (result.response.length > 0) {
            this.tpbOrders = result.response.map((order) => {
                const modifiedOrder = {
                    ...order,
                    date: order.date.split('T')[0],
                };
                return modifiedOrder;
            });
        }
    }

    statusName(status: string): string {
        switch (status) {
            case '0':
                return 'Unknown';
            case '1':
                return 'Received';
            case '2':
                return 'Unused';
            case '4':
                return 'In Production';
            case '8':
                return 'Dispatched';
            case '32':
                return 'QC Query';
            case '64':
                return 'Dispatched (Retailer Notified)';
            case '128':
                return 'Cancelled';
            case '256':
                return 'On Hold';
            case '512':
                return 'Sent to Supplier';
            case '513':
                return 'Received by Supplier';
            case '515':
                return 'Sent to Shipper';
            case '516':
                return 'Received by Shipper';
            case '600':
                return 'Consolidating';

            default:
                return '';
        }
    }
}

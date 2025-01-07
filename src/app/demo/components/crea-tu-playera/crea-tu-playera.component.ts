import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CreaTuPlayeraService } from '../../service/crea-tu-playera.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SwiftpodService } from '../../service/swift.service';
import { MessageService } from 'primeng/api';
import { ThePrintbarService } from '../../service/the-printbar.service';
import { OrderUpdateService } from '../../service/order-update.service';

// const INTERVAL_DURATION = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
const INTERVAL_DURATION = 15 * 60 * 1000; // 2 horas en milisegundos
const authorizationToken = environment.tokenBase64;
const headers = new Headers({
    Authorization: `Basic ${authorizationToken}`,
    'Content-Type': 'application/json',
});

@Component({
    templateUrl: './crea-tu-playera.component.html',
    providers: [MessageService],
})
export class CreaTuPlayeraComponent implements OnInit, OnDestroy {
    ctpOrders: any[] = [];
    tpbOrders: any[] = [];
    swiftpodOrders: any[] = [];
    ordersWithoutUpdate: any[] = [];
    ordersByStore: { site_name: string; count: number }[] = [];

    isRotated: boolean = false;
    processing: boolean = false;

    countdownMessage: string = '';

    countdownSubscription: Subscription;

    targetDate: Date;

    constructor(
        public router: Router,
        private creaTuPlayerService: CreaTuPlayeraService,
        private thePrintbarService: ThePrintbarService,
        private swiftPodService: SwiftpodService,
        private http: HttpClient,
        private messageService: MessageService,
        private orderUpdate: OrderUpdateService
    ) {}

    async ngOnInit() {
        this.startCountdown();

        await this.loadOrders();

        await this.getOrdersWithoutUpdate();

        await this.updateStatus();
        await this.updateSwiftPODStatus();
        await this.updateTPBStatus();

        this.countOrdersBySite();
    }

    // ----------------------- Counter Zone ---------------------------------

    startCountdown(): void {
        this.calculateNextQuarterHour();
        // Inicia la cuenta regresiva
        this.countdownSubscription = interval(1000).subscribe(() => {
            // Calcula la diferencia entre la hora objetivo y la hora actual
            const timeDiff = this.targetDate.getTime() - Date.now();

            if (timeDiff <= 0) {
                //Recargar ordenes
                this.loadOrders();
                // Actualizar las ordenes
                this.updateStatus();
                this.updateSwiftPODStatus();
                this.updateTPBStatus();
                // Si el tiempo restante es menor o igual a cero, calcula el próximo cuarto de hora y reinicia la cuenta regresiva
                this.calculateNextQuarterHour();
            } else {
                // Calcula las horas, minutos y segundos restantes
                const minutesRemaining = Math.floor(timeDiff / (1000 * 60));
                const secondsRemaining = Math.floor(
                    (timeDiff % (1000 * 60)) / 1000
                );

                const minutesString =
                    minutesRemaining < 10
                        ? `0${minutesRemaining}`
                        : minutesRemaining.toString();
                const secondsString =
                    secondsRemaining < 10
                        ? `0${secondsRemaining}`
                        : secondsRemaining.toString();

                // Construye el mensaje con el contador regresivo
                this.countdownMessage = `00:${minutesString}:${secondsString}`;
            }
        });
    }

    calculateNextQuarterHour(): void {
        const now = new Date();
        const minutes = now.getMinutes();
        let nextQuarter = 15 * Math.ceil((minutes + 1) / 15);

        // Si la próxima hora supera los 60 minutos, ajustar la hora
        if (nextQuarter >= 60) {
            nextQuarter = 0;
            now.setHours(now.getHours() + 1);
        }

        // Establecer minutos y segundos en cero
        this.targetDate = new Date();
        this.targetDate.setHours(now.getHours(), nextQuarter, 0, 0);
    }

    // -------------------- Get Zone --------------------------------------

    async loadOrders() {
        await this.getCTPOrders();
        await this.getTPBOrders();
        await this.getSwiftPODOrders();
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

    async getOrdersWithoutUpdate() {
        const result = await this.swiftPodService.getOrdersWithoutUpdate();
        this.ordersWithoutUpdate = result.data;
    }

    //---------------- Update zone ----------------------------------------------

    async updateStatus() {
        this.ctpOrders = await this.orderUpdate.updateStatus(
            this.ctpOrders,
            this.creaTuPlayerService
        );
        console.log(this.ctpOrders);
    }

    async updateSwiftPODStatus() {
        this.swiftpodOrders = await this.orderUpdate.updateSwiftPODStatus(
            this.swiftpodOrders,
            this.swiftPodService
        );
        console.log(this.swiftpodOrders);
    }

    async updateTPBStatus() {
        this.tpbOrders = await this.orderUpdate.updateTPBStatus(
            this.tpbOrders,
            this.thePrintbarService
        );
        console.log(this.tpbOrders);
    }

    // async updateStatus() {
    //     try {
    //         if (this.ctpOrders.length > 0) {
    //             const result = await Promise.all(
    //                 this.ctpOrders.map(async (order) => {
    //                     const exist =
    //                         await this.creaTuPlayerService.getKornitXOrders(
    //                             order.order_id
    //                         );

    //                     if (exist.data.length > 0) {
    //                         if (exist.data[0].status == order.status) {
    //                             return { ...order };
    //                         } else {
    //                             let data: any = {
    //                                 status: parseInt(exist.data[0].status),
    //                                 carrier: exist.data[0].shipping_carrier,
    //                             };

    //                             if (exist.data[0].shipping_tracking !== '') {
    //                                 data.tracking_number =
    //                                     exist.data[0].shipping_tracking;
    //                             }
    //                             // Actualizar en la BD MySQL
    //                             await this.creaTuPlayerService.updateCTPOrders(
    //                                 order.order_id,
    //                                 data
    //                             );

    //                             // Mark as Shipped de Shipstation para enviar el tracking de ML
    //                             if (
    //                                 exist.data[0].status == 8 ||
    //                                 exist.data[0].status == 520
    //                             ) {
    //                                 // const authorizationToken =
    //                                 //     environment.tokenBase64;
    //                                 const payload = {
    //                                     orderId: exist.data[0].order_id,
    //                                     carrierCode:
    //                                         data.tracking_number !== undefined
    //                                             ? exist.data[0].shipping_carrier
    //                                             : order.carrier,
    //                                     shipDate: new Date()
    //                                         .toISOString()
    //                                         .split('T')[0],
    //                                     trackingNumber:
    //                                         data.tracking_number !== undefined
    //                                             ? data.tracking_number
    //                                             : order.tracking_number,
    //                                     notifyCustomer: true,
    //                                     notifySalesChannel: true,
    //                                 };

    //                                 try {
    //                                     const response = await fetch(
    //                                         environment.SHIP_URL_MARKASSHIPPED,
    //                                         {
    //                                             method: 'POST',
    //                                             headers,
    //                                             body: JSON.stringify(payload),
    //                                         }
    //                                     );

    //                                     if (!response.ok) {
    //                                         const errorData =
    //                                             await response.json();
    //                                         throw new Error(errorData.message);
    //                                     }

    //                                     const responseData =
    //                                         await response.json();
    //                                     console.log(responseData);
    //                                 } catch (error) {
    //                                     console.error('Error:', error);
    //                                     throw error;
    //                                 }
    //                             }

    //                             return {
    //                                 ...order,
    //                                 status: data.status,
    //                                 status_name: this.statusName(
    //                                     data.status.toString()
    //                                 ),
    //                                 tracking_number:
    //                                     data.tracking_number !== undefined
    //                                         ? data.tracking_number
    //                                         : order.tracking_number,
    //                                 carrier: data.carrier,
    //                                 updated: true,
    //                             };
    //                         }
    //                     }
    //                     return { ...order };
    //                 })
    //             );

    //             this.ctpOrders = result;
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // async updateSwiftPODStatus() {
    //     try {
    //         if (this.swiftpodOrders.length > 0) {
    //             const result = await Promise.all(
    //                 this.swiftpodOrders.map(async (order) => {
    //                     const exist =
    //                         await this.swiftPodService.getSwiftPODOrdersStatus(
    //                             order.swift_id
    //                         );

    //                     if (exist.data.length > 0) {
    //                         if (
    //                             exist.data[0].status == order.status &&
    //                             (exist.data[0].tracking_number == null ||
    //                                 exist.data[0].tracking_number ==
    //                                     undefined ||
    //                                 exist.data[0].tracking_number == '')
    //                         ) {
    //                             return { ...order };
    //                         } else {
    //                             console.log(
    //                                 `Updating order ${order.site_order_id}`
    //                             );
    //                             let data: any = {
    //                                 date: exist.data[0].date_change
    //                                     ? exist.data[0].date_change.split(
    //                                           'T'
    //                                       )[0]
    //                                     : '',
    //                                 status: exist.data[0].status,
    //                                 carrier: exist.data[0].tracking_code
    //                                     ? exist.data[0].tracking_code
    //                                     : '',
    //                                 tracking_code: exist.data[0].tracking_number
    //                                     ? exist.data[0].tracking_number
    //                                     : '',
    //                                 tracking_url: exist.data[0].tracking_url
    //                                     ? exist.data[0].tracking_url
    //                                     : '',
    //                                 ship_date: exist.data[0].date_tracking
    //                                     ? exist.data[0].date_tracking.split(
    //                                           'T'
    //                                       )[0]
    //                                     : '',
    //                             };

    //                             // Eliminar propiedades con valores vacíos
    //                             Object.entries(data).forEach(([key, value]) => {
    //                                 if (value === '') {
    //                                     delete data[key];
    //                                 }
    //                             });

    //                             // Actualizar en la BD MySQL
    //                             await this.swiftPodService.updateSwiftPODOrderStatus(
    //                                 order.swift_id,
    //                                 data
    //                             );

    //                             // Mark as Shipped de Shipstation para enviar el tracking de ML
    //                             if (
    //                                 exist.data[0].status == 'shipped' &&
    //                                 exist.data[0].tracking_number !== null &&
    //                                 exist.data[0].tracking_number !==
    //                                     undefined &&
    //                                 exist.data[0].tracking_number !== ''
    //                             ) {
    //                                 // const authorizationToken =
    //                                 //     environment.tokenBase64;
    //                                 const payload = {
    //                                     orderId: parseInt(order.order_id),
    //                                     carrierCode:
    //                                         exist.data[0].tracking_code,
    //                                     shipDate: new Date()
    //                                         .toISOString()
    //                                         .split('T')[0],
    //                                     trackingNumber:
    //                                         exist.data[0].tracking_number,
    //                                     notifyCustomer: true,
    //                                     notifySalesChannel: true,
    //                                 };

    //                                 // const headers = new Headers({
    //                                 //     Authorization: `Basic ${authorizationToken}`,
    //                                 //     'Content-Type': 'application/json',
    //                                 // });

    //                                 const response = await fetch(
    //                                     environment.SHIP_URL_MARKASSHIPPED,
    //                                     {
    //                                         method: 'POST',
    //                                         headers,
    //                                         body: JSON.stringify(payload),
    //                                     }
    //                                 );

    //                                 if (!response.ok) {
    //                                     const errorData = await response.json();
    //                                     throw new Error(errorData.message);
    //                                 }

    //                                 const responseData = await response.json();
    //                                 console.log(responseData);
    //                             }

    //                             return {
    //                                 ...order,
    //                                 status: data.status ? data.status : '',
    //                                 tracking_code: data.tracking_code
    //                                     ? data.tracking_code
    //                                     : '',
    //                                 tracking_url: data.tracking_url
    //                                     ? data.tracking_url
    //                                     : '',
    //                                 carrier: data.carrier ? data.carrier : '',
    //                                 date_status: data.date ? data.date : '',
    //                                 date_shipment: data.ship_date
    //                                     ? data.ship_date
    //                                     : '',
    //                                 updated: true,
    //                             };
    //                         }
    //                     }
    //                     return { ...order };
    //                 })
    //             );
    //             this.swiftpodOrders = result;
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // async updateTPBStatus() {
    //     try {
    //         if (this.tpbOrders.length > 0) {
    //             const result = await Promise.all(
    //                 this.tpbOrders.map(async (order) => {
    //                     const exist =
    //                         await this.thePrintbarService.getOrderFromThePrintbar(
    //                             order.order_number
    //                         );

    //                     if (exist.response) {
    //                         const orderFromTPB = exist.response;
    //                         const lastEvent = orderFromTPB.events.at(-1);
    //                         console.log(order);

    //                         if (order.tpb_signal !== lastEvent.action) {
    //                             console.log(
    //                                 `Updating order ${order.order_number}`
    //                             );

    //                             // Actualizar MySQl DB
    //                             const dataToUpdate = {
    //                                 signal: lastEvent.action,
    //                                 order_number: orderFromTPB.id,
    //                                 reference_id: orderFromTPB.referenceId,
    //                             };
    //                             await this.thePrintbarService.updateOrderUnshipped(
    //                                 dataToUpdate
    //                             );

    //                             // Actualizar MongoDB collection
    //                             await this.thePrintbarService.setMongoTPBOrder(
    //                                 orderFromTPB
    //                             );

    //                             if (lastEvent.action === 'shipped') {
    //                                 // Marcar como Shipped en Shipstation
    //                                 const payload = {
    //                                     orderId: parseInt(order.order_id),
    //                                     carrierCode: lastEvent.carrier,
    //                                     shipDate: new Date()
    //                                         .toISOString()
    //                                         .split('T')[0],
    //                                     trackingNumber:
    //                                         lastEvent.trackingNumber,
    //                                     notifyCustomer: true,
    //                                     notifySalesChannel: true,
    //                                 };

    //                                 const response = await fetch(
    //                                     environment.SHIP_URL_MARKASSHIPPED,
    //                                     {
    //                                         method: 'POST',
    //                                         headers,
    //                                         body: JSON.stringify(payload),
    //                                     }
    //                                 );

    //                                 if (!response.ok) {
    //                                     const errorData = await response.json();
    //                                     throw new Error(errorData.message);
    //                                 }

    //                                 const responseData = await response.json();
    //                                 console.log(responseData);

    //                                 // Actualizar MySQl DB el Shipment
    //                                 const shipmentDataToUpdate = {
    //                                     signal: lastEvent.action,
    //                                     order_number: orderFromTPB.id,
    //                                     reference_id: orderFromTPB.referenceId,
    //                                     carrier: lastEvent.carrier,
    //                                     tracking_number:
    //                                         lastEvent.trackingNumber,
    //                                     ship_date: this.formatDate(
    //                                         lastEvent.time
    //                                     ),
    //                                     tracking_url: lastEvent.trackingUrl,
    //                                 };
    //                                 const respShipUpdate =
    //                                     await this.thePrintbarService.updateOrderShipment(
    //                                         shipmentDataToUpdate
    //                                     );
    //                             }

    //                             return {
    //                                 ...order,
    //                                 tpb_status: 'success',
    //                                 tpb_signal: lastEvent.action
    //                                     ? lastEvent.action
    //                                     : '',
    //                                 tracking_code: lastEvent.trackingNumber
    //                                     ? lastEvent.trackingNumber
    //                                     : '',
    //                                 tracking_url: lastEvent.trackingUrl
    //                                     ? lastEvent.trackingUrl
    //                                     : '',
    //                                 carrier: lastEvent.carrier
    //                                     ? lastEvent.carrier
    //                                     : '',
    //                                 updated: true,
    //                             };
    //                         } else {
    //                             return { ...order };
    //                         }
    //                     }
    //                     return { ...order };
    //                 })
    //             );

    //             this.tpbOrders = result;
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // ---------------- Helpers -------------------------------------------------

    //-----------------------------------------------------------------------------

    async processOrdersWithoutUpdate() {
        this.processing = true;
        try {
            console.log(this.ordersWithoutUpdate);
            
            const processed = await this.creaTuPlayerService.processOrdersWithoutUpdate(this.ordersWithoutUpdate);
            console.log(processed);
            this.messageService.add({
                severity: 'success',
                summary: 'Orders updated on Shipstation',
                detail: `${processed.success}`,
                key: 'br',
                life: 3000,
            });
            
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error Message',
                detail: `${error.error}`,
                key: 'br',
                life: 3000,
            });
            console.log(error);
        }
        this.processing = false;
    }

    countOrdersBySite(): void {
        const orderCount: { [key: string]: number } = {};

        // Recorrer el array de órdenes y contar las órdenes por site_name
        this.swiftpodOrders.forEach((order) => {
            if (order.site_name in orderCount) {
                orderCount[order.site_name]++;
            } else {
                orderCount[order.site_name] = 1;
            }
        });

        // Convertir el objeto de contadores en un array de objetos
        this.ordersByStore = Object.entries(orderCount).map(
            ([site_name, count]) => ({
                site_name,
                count,
            })
        );
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

    formatDate(date: string): string {
        let resultDate: string = '';
        if (date !== '') {
            const datePart1 = date.split('T')[0];
            const datePart2 = date.split('T')[1].split('.')[0];

            resultDate = datePart1 + ' ' + datePart2;
        }
        return resultDate;
    }

    ngOnDestroy() {
        // Cancela la suscripción al destruir el componente
        if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
        }
    }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CreaTuPlayeraService } from '../../service/crea-tu-playera.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SwiftpodService } from '../../service/swift.service';

const INTERVAL_DURATION = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

@Component({
    templateUrl: './crea-tu-playera.component.html',
})
export class CreaTuPlayeraComponent implements OnInit, OnDestroy {
    ctpOrders: any[] = [];
    swiftpodOrders: any[] = [];

    isRotated = false;

    countdownMessage: string = '';

    countdownSubscription: Subscription;

    targetDate: Date;

    constructor(
        public router: Router,
        private creaTuPlayerService: CreaTuPlayeraService,
        private swiftPodService: SwiftpodService,
        private http: HttpClient
    ) {}

    async ngOnInit() {
        this.startCountdown();

        await this.getCTPOrders();
        await this.getSwiftPODOrders();

        await this.updateStatus();
        await this.updateSwiftPODStatus();
    }

    startCountdown(): void {
        this.calculateNextEvenHour();
        // Inicia la cuenta regresiva
        this.countdownSubscription = interval(1000).subscribe(() => {
            // Calcula la diferencia entre la hora objetivo y la hora actual
            const timeDiff = this.targetDate.getTime() - Date.now();

            if (timeDiff <= 0) {
                // Actualizar las ordenes
                this.updateStatus();
                // Si el tiempo restante es menor o igual a cero, calcula la próxima hora par y reinicia la cuenta regresiva
                this.calculateNextEvenHour();
            } else {
                // Calcula las horas, minutos y segundos restantes
                const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesRemaining = Math.floor(
                    (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
                );
                const secondsRemaining = Math.floor(
                    (timeDiff % (1000 * 60)) / 1000
                );

                const hoursString =
                    hoursRemaining < 10
                        ? `0${hoursRemaining}`
                        : hoursRemaining.toString();
                const minutesString =
                    minutesRemaining < 10
                        ? `0${minutesRemaining}`
                        : minutesRemaining.toString();
                const secondsString =
                    secondsRemaining < 10
                        ? `0${secondsRemaining}`
                        : secondsRemaining.toString();

                // Construye el mensaje con el contador regresivo
                this.countdownMessage = `${hoursString}:${minutesString}:${secondsString}.`;
            }
        });
    }

    calculateNextEvenHour(): void {
        const now = new Date();
        let nextHour = now.getHours();

        // Si la hora actual es impar, sumar 1 para hacerla par
        if (nextHour % 2 !== 0) {
            nextHour++;
        } else {
            nextHour += 2;
        }

        // Establecer minutos y segundos en cero
        this.targetDate = new Date();
        this.targetDate.setHours(nextHour, 0, 0, 0);
    }

    async getCTPOrders() {
        // this.isRotated = false;
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
            // this.isRotated = true;
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

    async updateStatus() {
        if (this.ctpOrders.length > 0) {
            const result = await Promise.all(
                this.ctpOrders.map(async (order) => {
                    const exist =
                        await this.creaTuPlayerService.getKornitXOrders(
                            order.order_id
                        );

                    if (exist.data.length > 0) {
                        if (exist.data[0].status == order.status) {
                            return { ...order };
                        } else {
                            let data: any = {
                                status: parseInt(exist.data[0].status),
                                carrier: exist.data[0].shipping_carrier,
                            };

                            if (exist.data[0].shipping_tracking !== '') {
                                data.tracking_number =
                                    exist.data[0].shipping_tracking;
                            }
                            // Actualizar en la BD MySQL
                            await this.creaTuPlayerService.updateCTPOrders(
                                order.order_id,
                                data
                            );

                            // Mark as Shipped de Shipstation para enviar el tracking de ML
                            if (exist.data[0].status == 8) {
                                const authorizationToken =
                                    environment.tokenBase64;
                                const payload = {
                                    orderId: exist.data[0].order_id,
                                    carrierCode:
                                        data.tracking_number !== undefined
                                            ? exist.data[0].shipping_carrier
                                            : order.carrier,
                                    shipDate: new Date()
                                        .toISOString()
                                        .split('T')[0],
                                    trackingNumber:
                                        data.tracking_number !== undefined
                                            ? data.tracking_number
                                            : order.tracking_number,
                                    notifyCustomer: true,
                                    notifySalesChannel: true,
                                };

                                const headers = new Headers({
                                    Authorization: `Basic ${authorizationToken}`,
                                    'Content-Type': 'application/json',
                                });

                                try {
                                    const response = await fetch(
                                        environment.SHIP_URL_MARKASSHIPPED,
                                        {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify(payload),
                                        }
                                    );

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.message);
                                    }

                                    const responseData = await response.json();
                                    console.log(responseData);
                                } catch (error) {
                                    console.error('Error:', error);
                                    throw error;
                                }
                            }

                            return {
                                ...order,
                                status: data.status,
                                status_name: this.statusName(
                                    data.status.toString()
                                ),
                                tracking_number:
                                    data.tracking_number !== undefined
                                        ? data.tracking_number
                                        : order.tracking_number,
                                carrier: data.carrier,
                                updated: true,
                            };
                        }
                    }
                    return { ...order };
                })
            );

            this.ctpOrders = result;
        }
    }

    async updateSwiftPODStatus() {
        try {
            if (this.swiftpodOrders.length > 0) {
                const result = await Promise.all(
                    this.swiftpodOrders.map(async (order) => {
                        const exist =
                            await this.swiftPodService.getSwiftPODOrdersStatus(
                                order.site_order_id
                            );

                        if (exist.data.length > 0) {
                            if (
                                exist.data[0].status == order.status &&
                                exist.data[0].status !== 'shipped'
                            ) {
                                return { ...order };
                            } else {
                                let data: any = {
                                    date: exist.data[0].date_change
                                        ? exist.data[0].date_change.split(
                                              'T'
                                          )[0]
                                        : '',
                                    status: exist.data[0].status,
                                    carrier: exist.data[0].tracking_code
                                        ? exist.data[0].tracking_code
                                        : '',
                                    tracking_code: exist.data[0].tracking_number
                                        ? exist.data[0].tracking_number
                                        : '',
                                    tracking_url: exist.data[0].tracking_url
                                        ? exist.data[0].tracking_url
                                        : '',
                                    ship_date: exist.data[0].date_tracking
                                        ? exist.data[0].date_tracking.split(
                                              'T'
                                          )[0]
                                        : '',
                                };

                                console.log({ data });
                                // Eliminar propiedades con valores vacíos
                                Object.entries(data).forEach(([key, value]) => {
                                    if (value === '') {
                                        delete data[key];
                                    }
                                });

                                // Actualizar en la BD MySQL
                                await this.swiftPodService.updateSwiftPODOrderStatus(
                                    order.order_id,
                                    data
                                );

                                // Mark as Shipped de Shipstation para enviar el tracking de ML
                                if (
                                    exist.data[0].tracking_status == 'delivered' || exist.data[0].tracking_number !== ''
                                ) {
                                    const authorizationToken =
                                        environment.tokenBase64;
                                    const payload = {
                                        orderId: parseInt(order.order_id),
                                        carrierCode:
                                            exist.data[0].tracking_code,
                                        shipDate: new Date()
                                            .toISOString()
                                            .split('T')[0],
                                        trackingNumber:
                                            exist.data[0].tracking_number,
                                        notifyCustomer: true,
                                        notifySalesChannel: true,
                                    };
                                    
                                    const headers = new Headers({
                                        Authorization: `Basic ${authorizationToken}`,
                                        'Content-Type': 'application/json',
                                    });

                                    const response = await fetch(
                                        environment.SHIP_URL_MARKASSHIPPED,
                                        {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify(payload),
                                        }
                                    );

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.message);
                                    }

                                    const responseData = await response.json();
                                    console.log(responseData);
                                }

                                return {
                                    ...order,
                                    status: data.status ? data.status : '',
                                    tracking_code: data.tracking_code
                                        ? data.tracking_code
                                        : '',
                                    tracking_url: data.tracking_url
                                        ? data.tracking_url
                                        : '',
                                    carrier: data.carrier ? data.carrier : '',
                                    date_status: data.date ? data.date : '',
                                    date_shipment: data.ship_date
                                        ? data.ship_date
                                        : '',
                                    updated: true,
                                };
                            }
                        }
                        return { ...order };
                    })
                );
                this.swiftpodOrders = result;
            }
        } catch (error) {
            console.log(error);
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

import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CreaTuPlayeraService } from './crea-tu-playera.service';
import { ThePrintbarService } from './the-printbar.service';
import { SwiftpodService } from './swift.service';

@Injectable({
    providedIn: 'root',
})
export class OrderUpdateService {
    
    authorizationToken = environment.tokenBase64;
    headers = new Headers({
        Authorization: `Basic ${this.authorizationToken}`,
        'Content-Type': 'application/json',
    });

    constructor() {}


    async updateStatus(ctpOrders,creaTuPlayerService): Promise<any> {
        try {
            if (ctpOrders && ctpOrders.length > 0) {
                const result = await Promise.all(
                    ctpOrders.map(async (order) => {
                        const exist =
                            await creaTuPlayerService.getKornitXOrders(
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
                                await creaTuPlayerService.updateCTPOrders(
                                    order.order_id,
                                    data
                                );

                                // Mark as Shipped de Shipstation para enviar el tracking de ML
                                if (
                                    exist.data[0].status == 8 ||
                                    exist.data[0].status == 520
                                ) {
                                    // const authorizationToken =
                                    //     environment.tokenBase64;
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

                                    try {
                                        const response = await fetch(
                                            environment.SHIP_URL_MARKASSHIPPED,
                                            {
                                                method: 'POST',
                                                headers: this.headers,
                                                body: JSON.stringify(payload),
                                            }
                                        );

                                        if (!response.ok) {
                                            const errorData =
                                                await response.json();
                                            throw new Error(errorData.message);
                                        }

                                        const responseData =
                                            await response.json();
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

                return result;
            }
            return [];
        } catch (error) {
            console.log(error);
        }
    }

    async updateSwiftPODStatus(swiftpodOrders, swiftPodService): Promise<any> {
        try {
            if (swiftpodOrders && swiftpodOrders.length > 0) {
                const result = await Promise.all(
                    swiftpodOrders.map(async (order) => {
                        const exist =
                            await swiftPodService.getSwiftPODOrdersStatus(
                                order.swift_id
                            );

                        if (exist.data.length > 0) {
                            if (
                                exist.data[0].status == order.status &&
                                (exist.data[0].tracking_number == null ||
                                    exist.data[0].tracking_number ==
                                        undefined ||
                                    exist.data[0].tracking_number == '')
                            ) {
                                return { ...order };
                            } else {
                                console.log(
                                    `Updating order ${order.site_order_id}`
                                );
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

                                // Eliminar propiedades con valores vacíos
                                Object.entries(data).forEach(([key, value]) => {
                                    if (value === '') {
                                        delete data[key];
                                    }
                                });

                                // Actualizar en la BD MySQL
                                await swiftPodService.updateSwiftPODOrderStatus(
                                    order.swift_id,
                                    data
                                );

                                // Mark as Shipped de Shipstation para enviar el tracking de ML
                                if (
                                    exist.data[0].status == 'shipped' &&
                                    exist.data[0].tracking_number !== null &&
                                    exist.data[0].tracking_number !==
                                        undefined &&
                                    exist.data[0].tracking_number !== ''
                                ) {
                                    // const authorizationToken =
                                    //     environment.tokenBase64;
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

                                    const response = await fetch(
                                        environment.SHIP_URL_MARKASSHIPPED,
                                        {
                                            method: 'POST',
                                            headers: this.headers,
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
                return result;
            }
            return [];
        } catch (error) {
            console.log(error);
        }
    }

    async updateTPBStatus(tpbOrders, thePrintbarService): Promise<any> {
        try {
            if (tpbOrders && tpbOrders.length > 0) {
                const result = await Promise.all(
                    tpbOrders.map(async (order) => {
                        const exist =
                            await thePrintbarService.getOrderFromThePrintbar(
                                order.order_number
                            );

                        if (exist.response) {
                            const orderFromTPB = exist.response;
                            const lastEvent = orderFromTPB.events.at(-1);
                            console.log(order);

                            if (order.tpb_signal !== lastEvent.action) {
                                console.log(
                                    `Updating order ${order.order_number}`
                                );

                                // Actualizar MySQl DB
                                const dataToUpdate = {
                                    signal: lastEvent.action,
                                    order_number: orderFromTPB.id,
                                    reference_id: orderFromTPB.referenceId,
                                };
                                await thePrintbarService.updateOrderUnshipped(
                                    dataToUpdate
                                );

                                // Actualizar MongoDB collection
                                await thePrintbarService.setMongoTPBOrder(
                                    orderFromTPB
                                );

                                if (lastEvent.action === 'shipped') {
                                    // Marcar como Shipped en Shipstation
                                    const payload = {
                                        orderId: parseInt(order.order_id),
                                        carrierCode: lastEvent.carrier,
                                        shipDate: new Date()
                                            .toISOString()
                                            .split('T')[0],
                                        trackingNumber:
                                            lastEvent.trackingNumber,
                                        notifyCustomer: true,
                                        notifySalesChannel: true,
                                    };

                                    const response = await fetch(
                                        environment.SHIP_URL_MARKASSHIPPED,
                                        {
                                            method: 'POST',
                                            headers: this.headers,
                                            body: JSON.stringify(payload),
                                        }
                                    );

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.message);
                                    }

                                    const responseData = await response.json();
                                    console.log(responseData);

                                    // Actualizar MySQl DB el Shipment
                                    const shipmentDataToUpdate = {
                                        signal: lastEvent.action,
                                        order_number: orderFromTPB.id,
                                        reference_id: orderFromTPB.referenceId,
                                        carrier: lastEvent.carrier,
                                        tracking_number:
                                            lastEvent.trackingNumber,
                                        ship_date: this.formatDate(
                                            lastEvent.time
                                        ),
                                        tracking_url: lastEvent.trackingUrl,
                                    };
                                    const respShipUpdate =
                                        await thePrintbarService.updateOrderShipment(
                                            shipmentDataToUpdate
                                        );
                                }

                                return {
                                    ...order,
                                    tpb_status: 'success',
                                    tpb_signal: lastEvent.action
                                        ? lastEvent.action
                                        : '',
                                    tracking_code: lastEvent.trackingNumber
                                        ? lastEvent.trackingNumber
                                        : '',
                                    tracking_url: lastEvent.trackingUrl
                                        ? lastEvent.trackingUrl
                                        : '',
                                    carrier: lastEvent.carrier
                                        ? lastEvent.carrier
                                        : '',
                                    updated: true,
                                };
                            } else {
                                return { ...order };
                            }
                        }
                        return { ...order };
                    })
                );

                return result;
            }
            return [];
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

    startPeriodicUpdates(
        ctpOrders,
        creaTuPlayerService,
        swiftpodOrders, 
        swiftPodService,
        tpbOrders,
        thePrintbarService
    ) {
        this.updateStatus(ctpOrders,creaTuPlayerService);
        this.updateSwiftPODStatus(swiftpodOrders, swiftPodService);
        this.updateTPBStatus(tpbOrders, thePrintbarService);
    }
}

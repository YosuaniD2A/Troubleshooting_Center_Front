import { Component, OnInit } from '@angular/core';
import { SwiftpodService } from '../../service/swift.service';
import { MessageService } from 'primeng/api';
import { CreaTuPlayeraService } from '../../service/crea-tu-playera.service';
import { environment } from 'src/environments/environment';
import { ThePrintbarService } from '../../service/the-printbar.service';

@Component({
    templateUrl: './console.component.html',
    styleUrls: ['./console.component.scss'],
    providers: [MessageService],
})
export class ConsoleComponent implements OnInit {
    incomingOrders: any[];
    incomingOrdersCTP: any[];
    incomingOrdersTPB: any[];
    skuList: string[] = [];

    constructor(
        private swiftpodService: SwiftpodService,
        private thePrintbarService: ThePrintbarService,
        private ctpService: CreaTuPlayeraService,
        private messageService: MessageService
    ) {}

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    async loadData() {
        try {
            const orders = await this.swiftpodService.getIncomingOrder();
            this.incomingOrders = orders.response;
            this.skuList = this.getUniqueSKUs(this.incomingOrders);
            console.log(this.skuList);

            const ordersTPB =
                await this.thePrintbarService.getIncomingOrdersTPB();
            this.incomingOrdersTPB = ordersTPB.response[0];
        } catch (error) {
            console.log(error);
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

    statusFlagsImages(order: any): boolean {
        if (!order) {
            return false;
        }

        for (const img of order.items) {
            if (img.front_art_url === '' || img.front_mockup_url === '') {
                return false;
            }
        }

        return true;
    }

    statusFlagsShipping(order: any): boolean {
        if (!order) {
            return false;
        }
        if (this.enableFlagShipping(order.pod_service, order.site_name)) {
            if (
                order.shipping_label === '' ||
                order.carrier === '' ||
                order.tracking_code === ''
            ) {
                return false;
            }
        }

        return true;
    }

    enableFlagShipping(pod: string, site_name: string): boolean {
        switch (pod) {
            case 'swiftpod':
                return false;
            case 'crea_tu_playera':
                if (site_name === 'Amazon Mexico' || site_name === 'Walmart') {
                    return false;
                } else {
                    return true;
                }
            case 'printbar':
                return false;
            default:
                return true;
        }
    }

    // ID Generator
    idGenerator() {
        const fecha = new Date();

        // Obtenemos los componentes de la fecha
        const year = fecha.getFullYear().toString().slice(-2);
        const month = ('0' + (fecha.getMonth() + 1)).slice(-2);
        const day = ('0' + fecha.getDate()).slice(-2);
        const hours = ('0' + fecha.getHours()).slice(-2);
        const minutes = ('0' + fecha.getMinutes()).slice(-2);
        const seconds = ('0' + fecha.getSeconds()).slice(-2);
        const milliseconds = ('00' + fecha.getMilliseconds()).slice(-3);

        // Construimos el código
        const codigo = `${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;

        return codigo;
    }

    // Build orders
    buildSwiftPODOrder(incomingOrderSwift: any): any {
        const line_items = incomingOrderSwift.items.map((item) => {
            const print_files = [];
            const preview_files = [];

            if (item.front_art_url !== '') {
                if (item.front_print_area == 'pocket') {
                    print_files.push({ key: 'front', url: item.front_art_url });
                } else {
                    print_files.push({ key: 'front', url: item.front_art_url });
                }
            }
            if (item.front_mockup_url !== '') {
                if (item.front_print_area == 'pocket') {
                    preview_files.push({
                        key: 'front',
                        url: item.front_mockup_url,
                    });
                } else {
                    preview_files.push({
                        key: 'front',
                        url: item.front_mockup_url,
                    });
                }
            }
            if (item.back_art_url !== '') {
                print_files.push({ key: 'back', url: item.back_art_url });
            }
            if (item.back_mockup_url !== '') {
                preview_files.push({ key: 'back', url: item.back_mockup_url });
            }
            if (item.inner_neck_art_url !== '') {
                print_files.push({
                    key: 'inner_neck_label',
                    url: item.inner_neck_art_url,
                });
            }

            return {
                order_item_id: `${this.idGenerator()}_${item.sku}`,
                sku: item.pod_service_sku,
                quantity: parseInt(item.quantity, 10),
                print_files,
                preview_files,
            };
        });

        const bodyData = {
            order_id: incomingOrderSwift.site_order_id, // Adiciona '_R' para reenviar orden
            test_order: false,
            order_status: 'new_order',
            line_items,
            address: {
                name: incomingOrderSwift.ship_to,
                phone: incomingOrderSwift.phone,
                street1: incomingOrderSwift.address_1,
                street2: '',
                city: incomingOrderSwift.city,
                state: incomingOrderSwift.region,
                country: incomingOrderSwift.country,
                zip: incomingOrderSwift.postal_code,
                force_verified_status: true,
            },
            return_address: {
                name: 'Fernando Flores',
                email: 'hello@smartprintsink.com',
                company: '',
                phone: '(+52) 686 125 6181',
                street1: '1153 Lincoln Road',
                street2: '',
                state: 'CA',
                city: 'San Jose',
                country: 'US',
                zip: '95125',
            },
            shipping_method: 'standard',
        };

        return bodyData;
    }

    buildCTPOrder(incomingOrderCTP: any): any {
        let items = [];

        incomingOrderCTP.forEach((order) => {
            items.push({
                sku: order.pod_service_sku,
                external_ref: order.sku,
                description: order.description,
                quantity: order.quantity,
                type: '1',
                external_url: order.art_url,
                external_thumbnail_url: order.image_url,
            });
        });
        const order = {
            external_ref: incomingOrderCTP[0].site_order_id,
            company_ref_id: this.selectToken(incomingOrderCTP[0].site_name)
                .companyRefId,
            sale_datetime: this.formatDate(incomingOrderCTP[0].order_date),

            // set recipient info
            customer_name: incomingOrderCTP[0].ship_to,
            shipping_company: incomingOrderCTP[0].ship_to,

            customer_email: '',
            customer_telephone: incomingOrderCTP[0].phone,

            shipping_address_1: incomingOrderCTP[0].address_1,
            shipping_address_2: incomingOrderCTP[0].address_2,
            shipping_address_3: incomingOrderCTP[0].address_3,
            shipping_postcode: incomingOrderCTP[0].postal_code,
            shipping_country_code: incomingOrderCTP[0].country,

            shipping_address_4: incomingOrderCTP[0].city,
            shipping_address_5: incomingOrderCTP[0].region,

            shipping_note_url: incomingOrderCTP[0].shipping_label,

            status_callback_url: `${environment.callbackBaseURL}${incomingOrderCTP[0].order_id}`,
            items,
        };

        return order;
    }

    buildTPBOrder(incomingOrderTPB: any): any {
        const addressFrom = {
            address1: '9 Florence st',
            city: 'Teneriffe',
            postalCode: '4005',
            country: 'AU',
            region: 'QLD',
            company: 'The Print Bar',
            email: 'sales@theprintbar.com',
            phone: '0738540608',
        };
        const addressTo = {
            address1: incomingOrderTPB[0].address_1,
            address2: incomingOrderTPB[0].address_2,
            city: incomingOrderTPB[0].city,
            postalCode: incomingOrderTPB[0].postal_code,
            country: incomingOrderTPB[0].country,
            region: incomingOrderTPB[0].region,
            firstName: incomingOrderTPB[0].ship_to.split(' ')[0],
            lastName: incomingOrderTPB[0].ship_to.split(' ')[1] ?? '',
            email: 'hello@smartprintsink.com',
            phone: '',
        };
        const shipping = {
            code: this.shippingCode(incomingOrderTPB[0].country),
            notes: '',
        };

        let items: any = [];
        incomingOrderTPB.forEach((order) => {
            const item = {
                id: order.sku,
                sku: order.tpb_sku,
                quantity: parseInt(order.quantity),
                prints: [
                    {
                        side: 'front', //Options provided per product at setup
                        preview: order.image_url,
                        artwork: order.art_url,
                    },
                ],
            };

            items.push(item);
        });

        const order = {
            id: incomingOrderTPB[0].site_order_id,
            addressFrom,
            addressTo,
            shipping,
            items,
        };

        return order;
    }

    async sendOrder(order: any) {
        try {
            if (order.pod_service == 'swiftpod') {
                const buildedSwiftPODOrder = this.buildSwiftPODOrder(order);

                const { response } =
                    await this.swiftpodService.sendSwiftPODOrder(
                        buildedSwiftPODOrder
                    );
                console.log(response);

                if (!response.status) {
                    this.messageService.add({
                        key: 'bc',
                        severity: 'error',
                        summary: 'Error',
                        detail: `${response.message}: Es posible que el sku no este registrado en el catálogo`,
                    });
                }

                if (response.status) {
                    const swiftpodOrder = {
                        site_order_id: order.site_order_id,
                        order_id: order.order_id,
                        swift_id: response.data.id,
                        site_name: order.site_name,
                        date: this.formatDate(order.order_date),
                        status: 'new_order',
                    };

                    // Insertar datos en la tabla swiftpod_orders
                    const result = await this.swiftpodService.saveSwiftPODOrder(
                        swiftpodOrder
                    );
                    this.loadData();
                }
            }
            if (order.pod_service == 'crea_tu_playera') {
                const result = await this.ctpService.getIncomingOrdersCTP(
                    order.site_order_id
                );
                this.incomingOrdersCTP = result.data[0];

                const buildedCTPOrder = this.buildCTPOrder(
                    this.incomingOrdersCTP
                );
                console.log(this.incomingOrdersCTP);
                console.log(buildedCTPOrder);
                const data = await this.ctpService.sendCTPOrder({
                    payload: buildedCTPOrder,
                    apiKey: this.selectToken(order.site_name).apiKey,
                    companyRefId: this.selectToken(order.site_name)
                        .companyRefId,
                });

                console.log(data);
                if (!data.response[0].has_error) {
                    //Insertar datos en la tabla crea_tu_playera_orders
                    const resp = await this.ctpService.saveCTPOrder({
                        data: {
                            id: data.response[0].id,
                            external_ref: data.response[0].external_ref,
                            status: data.response[0].status,
                            shipping_carrier: data.response[0].shipping_carrier,
                            shipping_tracking:
                                data.response[0].shipping_tracking,
                            date: this.formatDate(new Date().toISOString()),
                        },
                        siteOrderId: order.site_order_id,
                    });

                    //Insertar datos en MongoDB
                    const respMongo = await this.ctpService.setMongoCTPOrder({
                        order: {
                            id: data.response[0].id,
                            ref: data.response[0].ref,
                            external_ref: data.response[0].external_ref,
                            status: data.response[0].status,
                            shipping_carrier: data.response[0].shipping_carrier,
                            shipping_method: data.response[0].shipping_method,
                            shipping_tracking:
                                data.response[0].shipping_tracking,
                            items: data.response[0].items,
                        },
                    });
                    console.log({
                        mysqlResponde: resp,
                        mongoResponse: respMongo,
                    });
                }

                this.loadData();
            }
            if (order.pod_service == 'printbar') {
                const orderFiltred = this.incomingOrdersTPB.filter(
                    (item) => item.site_order_id === order.site_order_id
                );
                const orderBuilded = this.buildTPBOrder(orderFiltred);
                console.log(orderBuilded);

                // Enviar la orden a The Printbar
                const { response } =
                    await this.thePrintbarService.sendThePrintbarOrder(
                        orderBuilded
                    );
                console.log(response);

                // Guardar la respuesta en la BD the_print_bar_orders
                const dbResponse =
                    await this.thePrintbarService.saveThePrintbarOrder(
                        response
                    );

                // Obtener la orden completa desde TPB
                const orderFromTPB =
                    await this.thePrintbarService.getOrderFromThePrintbar(
                        response.id
                    );

                // Guardar en la tabla tpb_orders de MongoDB
                const mongoResponse =
                    await this.thePrintbarService.setMongoTPBOrder(
                        orderFromTPB.response
                    );
                console.log(mongoResponse);

                this.loadData();
            }
        } catch (error) {
            console.log(error);
            this.messageService.add({
                key: 'bc',
                severity: 'error',
                summary: 'Error',
                detail: error,
            });
        }
    }

    selectToken(siteName: string): any {
        const token1GroupStore = [
            'Amazon Mexico',
            'SmartPrintsInk',
            'Wish',
            'Teeblox Store',
            'Amazon',
            'Manual Order',
        ];
        const token2GroupStore = ['Mercado Libre', 'Coppel', 'Walmart MX'];
        if (token1GroupStore.includes(siteName)) {
            return {
                companyRefId: environment.companyRefId_1,
                apiKey: environment.apiKey_1,
            };
        }
        if (token2GroupStore.includes(siteName)) {
            return {
                companyRefId: environment.companyRefId_2,
                apiKey: environment.apiKey_2,
            };
        }
        return {};
    }

    shippingCode(country: string): string {
        if (country === 'AU') {
            return 'regular';
        }
        return 'international';
    }

    getUniqueSKUs(data): any[] {
        const skuSet = new Set();

        data.forEach((obj) => {
            obj.items.forEach((item) => {
                skuSet.add(item.sku);
            });
        });

        return Array.from(skuSet);
    }

    downloadSKUsAsTxt() {
        const uniqueSKUs = this.skuList;
        const skuString = uniqueSKUs.join('\n');
        const blob = new Blob([skuString], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Unique_SKUs.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

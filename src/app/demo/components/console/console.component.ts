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
    showSpinnerInitial: boolean = false;
    progressMessageInitial: string = 'Cargando ordenes...';

    incomingOrders: any[];
    incomingOrdersCTP: any[];
    incomingOrdersTPB: any[];
    skuList: string[] = [];

    showSpinner: boolean = false;
    progressMessage: string = '';

    constructor(
        private swiftpodService: SwiftpodService,
        private thePrintbarService: ThePrintbarService,
        private ctpService: CreaTuPlayeraService,
        private messageService: MessageService
    ) {}

    async ngOnInit(): Promise<void> {
        this.showSpinnerInitial = true;
        await this.loadData();
        this.showSpinnerInitial = false;
    }

    async loadData() {
        try {
            const orders = await this.swiftpodService.getIncomingOrder();
            this.incomingOrders = orders.response;
            this.skuList = this.getUniqueSKUs(this.incomingOrders);
            console.log(this.incomingOrders);

            const ordersTPB =
                await this.thePrintbarService.getIncomingOrdersTPB();
            this.incomingOrdersTPB = ordersTPB.response[0];
        } catch (error) {
            console.log(error);
            this.showSpinnerInitial = false;
            this.messageService.add({
                key: 'bc',
                severity: 'error',
                summary: 'Error',
                // detail: `Enlazados ${successMockCount}/${totalMockups} mockups y ${successArtCount}/${totalArts} arts`,
                detail: `${error.error.error}`,
                life: 5000,
            });
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
    async buildSwiftPODOrder(incomingOrderSwift: any) {
        const line_items = await Promise.all(
            incomingOrderSwift.items.map(async (item) => {
                const print_files = [];
                const preview_files = [];

                if (item.front_art_url !== '') {
                    if (
                        item.front_print_area == 'poster' ||
                        item.sku.includes('UNSPP')
                    ) {
                        print_files.push({
                            key: 'poster',
                            url: item.front_art_url,
                        });
                    } else {
                        print_files.push({
                            key: 'front',
                            url: item.front_art_url,
                        });
                    }
                }
                if (item.front_mockup_url !== '') {
                    if (item.front_print_area == 'poster') {
                        preview_files.push({
                            key: 'poster',
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
                    preview_files.push({
                        key: 'back',
                        url: item.back_mockup_url,
                    });
                }
                if (item.inner_neck_art_url !== '') {
                    print_files.push({
                        key: 'inner_neck_label',
                        url: item.inner_neck_art_url,
                    });
                } else {
                    const url = await this.selectInnerNeckLabel(item.sku);
                    if (url !== '') {
                        print_files.push({
                            key: 'inner_neck_label',
                            url,
                        });
                    }
                }

                return {
                    order_item_id: `${this.idGenerator()}_${item.sku}`,
                    sku: item.pod_service_sku,
                    quantity: parseInt(item.quantity, 10),
                    print_files,
                    preview_files,
                };
            })
        );

        const bodyData = {
            order_id: incomingOrderSwift.site_order_id, // Adiciona '_R' para reenviar orden
            test_order: false,
            order_status: 'new_order',
            line_items,
            address: {
                name: incomingOrderSwift.ship_to,
                phone: incomingOrderSwift.phone,
                street1: incomingOrderSwift.address_1,
                street2: incomingOrderSwift.address_2
                    ? incomingOrderSwift.address_2
                    : '',
                city: incomingOrderSwift.city,
                state: incomingOrderSwift.region,
                country: incomingOrderSwift.country,
                zip: incomingOrderSwift.postal_code,
                force_verified_status: true,
            },
            return_address: {
                name: 'D2America dba - SmartPrintsInk',
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
                const buildedSwiftPODOrder = await this.buildSwiftPODOrder(
                    order
                );
                console.log(buildedSwiftPODOrder);

                const { response } =
                    await this.swiftpodService.sendSwiftPODOrder(
                        buildedSwiftPODOrder,
                        order.site_name
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

    async selectInnerNeckLabel(sku: string) {
        if (sku.length !== 20) {
            return '';
        }
        const lightColors = [
            '17',
            '25',
            '26',
            '27',
            '32',
            '33',
            '38',
            '46',
            '51',
            '58',
            '60',
            '65',
            '74',
            '75',
            '0G',
            '0Y',
            '1H',
            '1W',
            '1Z',
            '2D',
            '2G',
            '2H',
            '2N',
            '2O',
            '2R',
            '2W',
            '3H',
            '3W',
            '3Y',
            '4F',
            '4N',
            '4W',
            '5H',
            '5P',
            '5W',
            '5Y',
            '6D',
            '7N',
            '7W',
            '8H',
            '8W',
            '9G',
            '9M',
            '9W',
            '9Y',
            '4H',
            '7H',
            '31',
            '34',
            '36',
            '1P',
            '4C',
            '50',
            '4E',
            '1Y',
            '3P',
            '76',
            '4Y',
            '82',
            '9C',
            '6G',
            '5N',
            '2Y',
            '6Y',
            '83',
            '1V',
            '1A',
            '3A',
            '4T',
            'E7',
            '8V',
            'J5',
            'L2',
            '4A',
            '5V',
            '6U',
            '6Q',
            '7Q',
            '7U',
            '3T',
        ];

        const brand = sku.substring(0, 2); // Primeros 2 caracteres
        const design = sku.substring(2, 10); // Siguientes 8 caracteres
        const categoria = sku.substring(10, 12); // Dos caracteres siguientes
        const estilo = sku.substring(12, 15); // Tres caracteres siguientes
        const color = sku.substring(15, 17); // 2 caracteres del color
        const size = sku.substring(17, 20); // 3 caracteres de la talla

        if (brand == 'SD') {
            const result = await this.swiftpodService.getSwiftPODBrand(design);

            if (!result.data || result.data.length == 0) return '';

            const license = result.data[0].brand_name;

            switch (license) {
                case 'Icee':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/kwewchs5x58ei15bucgvv/ICEE-NECK-LABEL.png?rlkey=pqr5svzca9go01sc8oie7izbq&st=4g3wb4be&raw=1'
                        : 'https://www.dropbox.com/scl/fi/7lopz06lg4bry88qzd96o/ICEE-NECK-LABEL_WHITE.png?rlkey=76y4k2pknxn8uzv1hngb3d8o6&st=5nkpi7zr&raw=1';
                case 'Cut Zoltar':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/1gu1nmr3sboo3l3uezvh4/ZOLTAR-NECK-LABEL.png?rlkey=zbp318k6rvk1kg6i9l8ld3r23&st=j8bhrpfi&raw=1'
                        : 'https://www.dropbox.com/scl/fi/klnyes42b0g56j66mr28g/ZOLTAR-NECK-LABEL_WHITE.png?rlkey=cqb3tm77gtgj5naoma3uoq6y1&st=swdm6eww&raw=1';
                case 'Dippin Dots':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/m7tmkwaps6jzumte0xp4c/DIPPIN-DOTS-NECK-LABEL.png?rlkey=utg2rbuonwqnbjohgglbnjby1&st=zsui7wpn&raw=1'
                        : 'https://www.dropbox.com/scl/fi/66bi44tivz4h32yfckbxp/DIPPIN-DOTS-NECK-LABEL_WHITE.png?rlkey=m2pa8hwc8ks0s53xhfjy0yxfn&st=x02khmwy&raw=1';
                case 'Sid The Science Kid':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/ubs53tynsyu0nfy5j8lmg/SID-THE-SCIENCE-KID-NECK-PRINT.png?rlkey=l34lcff5tuw2py8wff68yo5r5&st=5qymwvw1&raw=1'
                        : 'https://www.dropbox.com/scl/fi/a2uwly9d81wmkfnwsm5wv/SID-THE-SCIENCE-KID-NECK-PRINT_WHITE.png?rlkey=jmncjja01uueqcsykk5rgwnv9&st=sfdnvck9&raw=1';
                case 'Emmet Otters':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/5qor25m1vav3i848mpavf/EMMET-OTTER-S-JUGBAND-CHRISTMAS_NECK-LABEL-BLACK.png?rlkey=0clquo97d2atos4vwur4x6p57&st=aezim39o&raw=1'
                        : 'https://www.dropbox.com/scl/fi/xzfjvv9orvt7mps4iqg7v/EMMET-OTTER-S-JUGBAND-CHRISTMAS_NECK-LABEL-WHITE.png?rlkey=t655ou76ekhhw6tw9acwj88u7&st=tvxkw21q&raw=1';
                case 'Emoji':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/obw3jhgxto0ru3xjr88rq/EMOJI-NECK-LABEL_BLACK.png?rlkey=s25t04s09kd22exsepd81dq23&st=dm881egt&raw=1'
                        : 'https://www.dropbox.com/scl/fi/6n3z7esj4jbtmh6ovyssx/EMOJI-NECK-LABEL_WHITE.png?rlkey=v847wjzg6esgebalqrgqgxfk3&st=pc2tragx&raw=1';
                case 'Hola Churro':
                    return lightColors.includes(color)
                        ? 'https://www.dropbox.com/scl/fi/yrl92477oxzn523bye5px/HOLA-CHURRO-NECK-LABEL.png?rlkey=95f3dv56k425t7oo1qlahzhm1&st=kjgcn5ep&raw=1'
                        : 'https://www.dropbox.com/scl/fi/8s67be83wsjarrvrd29u5/HOLA-CHURRO-NECK-LABEL_WHITE.png?rlkey=amm1us1mfrdbwgufjeup4l40k&st=igfpbh3y&raw=1';

                default:
                    return '';
            }
        }
        if (brand == 'GP') {
            if (categoria == 'ME') {
                switch (size) {
                    case '00S':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/87dvjbgzp7lqyy2oh7ux1/NECK_S.png?rlkey=h8tstfvkc4lx68gfkgrcib747&st=lqnt3gjm&dl=0'
                            : 'https://www.dropbox.com/scl/fi/4el4x24ww0h1cmw6z2z26/NECK_S.png?rlkey=gaps624is040zt0zwbnenujpm&st=i87xzmhs&dl=0';
                    case '00M':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/n2460394ky4me6zztgaba/NECK_M.png?rlkey=wlvj3gm1l3sr74blzrd5psrui&st=0cbxyuij&dl=0'
                            : 'https://www.dropbox.com/scl/fi/q4j3mgbu9j1j5faw3w6i4/NECK_M.png?rlkey=2b6wkbw0z23t5qa4ns5o2ag91&st=zke6z7sj&dl=0';
                    case '00L':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/za0tgzsl31gtxlao91m9u/NECK_L.png?rlkey=w3vztnf5b7pjz6mqu3w7vao37&st=y455u2tm&dl=0'
                            : 'https://www.dropbox.com/scl/fi/t7ybxde7axyc9h8hx1sql/NECK_L.png?rlkey=s918mn4gxtcojdjhwbdig2mds&st=y5sid9oc&dl=0';
                    case '0XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/82yb90vkz60ygmyvjosbv/NECK_XL.png?rlkey=ng1zgl6p4i86m6mnu5gslmd3m&st=0xa6gy7j&dl=0'
                            : 'https://www.dropbox.com/scl/fi/rntj5qxxfrfonbnzvnx9n/NECK_XL.png?rlkey=4h3u17yzv3946zmmlmjbcp0av&st=jmmrdijj&dl=0';
                    case '2XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/r2ojh8yn3iph1nwbraexk/NECK_2X.png?rlkey=06swxnfhoaa25mws9pemwuwqc&st=gqeiqdt2&dl=0'
                            : 'https://www.dropbox.com/scl/fi/rpuyfe24q1k28qmk1r25o/NECK_2X.png?rlkey=qxjpxyzkil6kus1s5l7qje6gg&st=26wq8gqm&dl=0';
                    case '3XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/mgoufrzi53vw026allvzz/NECK_3X.png?rlkey=t5tqd3rl2k7l0tdi520ambl81&st=zc3a6djd&dl=0'
                            : 'https://www.dropbox.com/scl/fi/353kfa71jrnv3v81qgb3t/NECK_3X.png?rlkey=frg8nafixx3fil2v7msqkpmzp&st=8q6lnt5p&dl=0';
                    case '4XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/ciq7y94w03r8g1c4zir8j/NECK_4X.png?rlkey=eh51uv225a9np5gmp5cnfho9u&st=1lkwbuuq&dl=0'
                            : 'https://www.dropbox.com/scl/fi/drrvayg8017qw81dca7v9/NECK_4X.png?rlkey=veqmjvy25u66ev8n3dhes1vri&st=4r0um40q&dl=0';
                    case '5XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/7qsq400qo3izz2xd5om6r/NECK_5X.png?rlkey=hez6zo5ri6luoedsrrcatrxyu&st=g3ew7rvm&dl=0'
                            : 'https://www.dropbox.com/scl/fi/61ouj0p2z97osrbhv4ak1/NECK_5X.png?rlkey=e6jr4t6z4gdry0v2712rxbaei&st=nqlt9lqe&dl=0';

                    default:
                        return '';
                }
            }
            if (categoria == 'WO') {
                switch (size) {
                    case '0XS':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/kfnexd2h3eerrn8h411i9/NECK_XS.png?rlkey=1hme48nixgqod76xvd41mtoc0&st=4z9znxfq&dl=0'
                            : 'https://www.dropbox.com/scl/fi/ufdq9wzr7zsk60jzunskh/NECK_XS.png?rlkey=nft3mqsfybbgukal51it4s6du&st=frh6hzda&dl=0';
                    case '00S':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/8c8j0by3dsueeyuzyeg5t/NECK_S.png?rlkey=q02sjjhmw1wqxfm2sgr8n6dhl&st=fnqoxvt9&dl=0'
                            : 'https://www.dropbox.com/scl/fi/t5703mm1tfuhvbnc4379x/NECK_S.png?rlkey=o2u6n2fugt0xlvlfml23oc1g4&st=qpv577o3&dl=0';
                    case '00M':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/l9cnvitriodva76qcli0w/NECK_M.png?rlkey=r2tuy4xri7qm5xgu6bjtukfdb&st=wr0opdes&dl=0'
                            : 'https://www.dropbox.com/scl/fi/encyrtx473iizvv8zdzig/NECK_M.png?rlkey=iqjursoki01pd6m3zjfxmkgr3&st=43gbe8bu&dl=0';
                    case '00L':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/v64g21rfi3aykl4saxy8k/NECK_L.png?rlkey=dbm439ajrz4k1rkpkibx46vxo&st=8xhawqa7&dl=0'
                            : 'https://www.dropbox.com/scl/fi/826ih3els62h94i8yz8lk/NECK_L.png?rlkey=no3t1k30vq6oryjn2lji7oqhk&st=y2pjagtf&dl=0';
                    case '0XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/e3f26ri6i0vk5wqyht8ve/NECK_XL.png?rlkey=jpxnyreozyxxceghytey39o37&st=i87sh61c&dl=0'
                            : 'https://www.dropbox.com/scl/fi/ou7k43lij0gub6u64wmuh/NECK_XL.png?rlkey=86xjxfi9z24uq6q8th5ppnttw&st=dszz25rd&dl=0';
                    case '2XL':
                        return lightColors.includes(color)
                            ? 'https://www.dropbox.com/scl/fi/v4broomp58ew68k1j4u88/NECK_2XL.png?rlkey=w7r5ljxelimjecfj1jmi3q85t&st=9pcw9cnh&dl=0'
                            : 'https://www.dropbox.com/scl/fi/g6tjx8zg1ragpqqvxvjlx/NECK_2XL.png?rlkey=l2nvn3sgccte3fvcztmc46gmd&st=6ouel6t8&dl=0';

                    default:
                        return '';
                }
            }
            if (categoria == 'YO') {
            }
            if (categoria == 'TO') {
            }
            if (categoria == 'BB') {
            }
        }

        return '';
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
                if (!item.front_art_url || !item.front_mockup_url) {
                    skuSet.add(item.sku);
                }
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

    async linkMockupAndArt() {
        let successMockCount = 0; // Contador de mockups enlazados con éxito
        let successArtCount = 0;
        let notFoundCount = 0; // Contador de mockups no encontrados
        const totalMockups = this.incomingOrders.flatMap((order) =>
            order.items.filter((item: any) => !item.front_mockup_url)
        ).length;
        const totalArts = this.incomingOrders.flatMap((order) =>
            order.items.filter((item: any) => !item.front_art_url)
        ).length;

        try {
            this.showSpinner = true; // Mostrar el modal
            this.progressMessage = 'Enlazando mockups...';

            // Crear todas las promesas
            const tasksMockups = this.incomingOrders.flatMap((order) =>
                order.items
                    .filter((item: any) => !item.front_mockup_url)
                    .map(async (item: any) => {
                        const skuBase = item.sku.slice(0, -3);
                        const formattedSize = item.size.padStart(3, '0');

                        try {
                            const response =
                                await this.swiftpodService.getLinkMockup(
                                    skuBase,
                                    formattedSize
                                );

                            if (response.status === 200) {
                                // item.front_mockup_url = response.mockup_url; // Actualizar la URL
                                successMockCount++;
                            } else if (response.status === 404) {
                                notFoundCount++;
                            }
                        } catch (error) {
                            notFoundCount++;
                        }
                    })
            );

            // Ejecutar todas las promesas en paralelo
            await Promise.all(tasksMockups);

            this.progressMessage = 'Enlazando arts...';
            const tasksArts = this.incomingOrders.flatMap((order) =>
                order.items
                    .filter((item: any) => !item.front_art_url)
                    .map(async (item: any) => {
                        try {
                            const response =
                                await this.swiftpodService.getLinkArt(
                                    item.design,
                                    item.pod_service
                                );

                            if (response.status === 200) {
                                // item.front_mockup_url = response.mockup_url; // Actualizar la URL
                                successArtCount++;
                            } else if (response.status === 404) {
                                notFoundCount++;
                            }
                        } catch (error) {
                            notFoundCount++;
                        }
                    })
            );

            // Ejecutar todas las promesas en paralelo
            await Promise.all(tasksArts);
            // Mostrar el resultado final
            this.messageService.add({
                key: 'bc',
                severity: 'info',
                summary: 'Proceso finalizado',
                // detail: `Enlazados ${successMockCount}/${totalMockups} mockups y ${successArtCount}/${totalArts} arts`,
                detail: `Proceso finalizado, mockups y arts enlazados`,
                life: 5000,
            });

            this.loadData();
        } catch (error) {
            console.error('Error procesando las órdenes:', error);
        } finally {
            this.showSpinner = false; // Ocultar el modal
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SwiftpodService } from 'src/app/demo/service/swift.service';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

@Component({
    templateUrl: './edit-order.component.html',
    styleUrls: ['./edit-order.component.scss'],
    providers: [MessageService],
})
export class EditOrderComponent implements OnInit {
    site_order_id: string;
    order: any;

    selectedItem: any;
    visible: boolean = false;

    checkedPocket: boolean = false;
    checkedPoster: boolean = false;

    //Front
    artURLFront: string = '';
    mockupURLFront: string = '';

    //Back
    artURLBack: string = '';
    mockupURLBack: string = '';

    //Inner
    artInnerNeck: string = '';
    checkedInnerNeck: boolean = true;

    //Outer
    artOuterNeck: string = '';
    checkedOuterNeck: boolean = false;

    shippingUrl: string = '';
    trackingCode: string = '';
    carriers: any[] = [
        { name: 'DHL Express', code: 'DHL' },
        { name: 'Estafeta', code: 'EST' },
        { name: 'FedEx Express', code: 'FDX' },
        { name: 'Mercado Libre', code: 'MLI' },
    ];
    selectedCarrier: any;

    constructor(
        private route: ActivatedRoute,
        private swiftpodService: SwiftpodService,
        private messageService: MessageService,
        private http: HttpClient
    ) {}

    async ngOnInit(): Promise<void> {
        this.loadData();
    }

    async loadData() {
        try {
            this.route.queryParams.subscribe((param) => {
                this.site_order_id = param['site_order_id'];
            });
            const orders = await this.swiftpodService.getIncomingOrder();
            const filtered = orders.response.filter((item) => {
                return item.site_order_id === this.site_order_id;
            });
            if (filtered.length > 0) this.order = filtered[0];
        } catch (error) {
            console.log(error);
        }
    }

    showDialog(order: any) {
        this.visible = true;
        this.checkedInnerNeck = false;

        this.selectedItem = order;
        
        this.artURLFront = this.selectedItem.front_art_url;
        this.mockupURLFront = this.selectedItem.front_mockup_url;
        this.artURLBack = this.selectedItem.back_art_url;
        this.mockupURLBack = this.selectedItem.back_mockup_url;
        this.artInnerNeck = this.selectedItem.inner_neck_art_url;
        this.artOuterNeck = this.selectedItem.outer_neck_art_url;

        if(this.selectedItem.front_print_area == 'pocket')
            this.checkedPocket = true;

        if(this.selectedItem.front_print_area == 'poster')
            this.checkedPoster = true;
   
    }

    onTextChange(event: any, field: string): void {
        const img_url: string = event.target.value;
        if(!img_url.includes(this.order.site_order_id)){
            this.messageService.add({
                key: 'bc',
                severity: 'error',
                summary: 'Error',
                detail: 'Verifique la URL de Shipping',
            });
        }

        switch (field) {
            case 'artURLFront':
                this.artURLFront = img_url.replace(/dl=0/g, 'dl=1');
                break;
            case 'mockupURLFront':
                this.mockupURLFront = img_url.replace(/dl=0/g, 'raw=1');
                break;
            case 'artURLBack':
                this.artURLBack = img_url.replace(/dl=0/g, 'dl=1');
                break;
            case 'mockupURLBack':
                this.mockupURLBack = img_url.replace(/dl=0/g, 'raw=1');
                break;
            case 'shippingUrl':
                this.shippingUrl = img_url.replace(/dl=0/g, 'raw=1');
                break;
            case 'innerNeck':
                this.artInnerNeck = img_url.replace(/dl=0/g, 'dl=1');
                break;
            case 'outerNeck':
                this.artOuterNeck = img_url.replace(/dl=0/g, 'dl=1');
                break;
            default:
                break;
        }
    }

    enableShipping(pod: string, site_name: string):boolean{
        switch(pod){
            case 'swiftpod':
                return false;
            case 'printbar':
                return false;
            case 'crea_tu_playera':
                if(site_name === 'Amazon Mexico' || site_name === 'Walmart'){
                    return false 
                }else{
                    return true
                }
            default:
                return true;
        } 
    }

    async saveShippingLabel() {
        try {
            if (
                this.shippingUrl !== '' &&
                this.trackingCode !== '' &&
                this.selectedCarrier
            ) {
                let tracking_url = '';
                switch (this.selectedCarrier.name) {
                    case 'Estafeta':
                        tracking_url =
                            'https://www.estafeta.com/Herramientas/Rastreo';
                        break;
                    case 'FedEx Express':
                        tracking_url = `https://www.fedex.com/fedextrack/?tracknumbers=${this.trackingCode}&cntry_code=mx`;
                        break;
                    default:
                        break;
                }

                const data = {
                    site_order_id: this.site_order_id,
                    tracking_code: this.trackingCode,
                    carrier: this.selectedCarrier.name,
                    url: this.shippingUrl,
                    tracking_url,
                };

                const result = await this.swiftpodService.saveShippingLabel(
                    data
                );
                console.log(result);

                if (result.response?.affectedRows > 0) {
                    this.messageService.add({
                        key: 'bc',
                        severity: 'success',
                        summary: 'Success',
                        detail: result.msg,
                    });
                } else {
                    this.messageService.add({
                        key: 'bc',
                        severity: 'error',
                        summary: 'Error',
                        detail: result.msg,
                    });
                }
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

    selectNeckImage(design: string) {
        if(design.length >= 11){
            const store = design.substring(0, 2);
            const product = design.slice(-5);

            const storeProductImageMap = {
                GP: {
                    METTA: 'https://www.dropbox.com/scl/fi/5wm09c2qcilu25wimdc3h/ETIQUETA-PIPELINE.png?rlkey=6moh9xohn3es7w72p7n2mrqci&st=swftwj9f&dl=0',
                    METSA: 'url_de_imagen_para_METSA_de_GP',
                    MELGA: 'url_de_imagen_para_METSA_de_GP',
                    MEHOA: 'url_de_imagen_para_MEHOA_de_GP',
                    MESWA: 'url_de_imagen_para_MESWA_de_GP',
                    WOTSA: 'url_de_imagen_para_WOTSA_de_GP',
                    WOHOA: 'url_de_imagen_para_WOHOA_de_GP',
                    WOCTT: 'url_de_imagen_para_WOCTT_de_GP',
                    WOSWA: 'url_de_imagen_para_WOSWA_de_GP',
                    // Puedes agregar más productos aquí según sea necesario
                },
                SS: {
                    WOTSA: 'url_de_imagen_para_WOCTT_de_SS',
                    METSA: 'url_de_imagen_para_METSA_de_SS',
                    MEHOA: 'url_de_imagen_para_MEHOA_de_SS',
                    WOHOA: 'url_de_imagen_para_WOHOA_de_SS',
                    WOCTT: 'url_de_imagen_para_WOCTT_de_SS',
                    WOSWA: 'url_de_imagen_para_WOCTT_de_SS',
                    // Puedes agregar más productos aquí según sea necesario
                },
                SR: {
                    WOTSA: 'url_de_imagen_para_WOTSA_de_SR',
                    METSA: 'url_de_imagen_para_METSA_de_SR',
                    MEHOA: 'url_de_imagen_para_MEHOA_de_SR',
                    WOHOA: 'url_de_imagen_para_WOHOA_de_SR',
                    WOCTT: 'url_de_imagen_para_WOCTT_de_SR',
                },
                // Puedes agregar más tiendas aquí según sea necesario
            };
            if(this.artInnerNeck === ''){
                this.artInnerNeck = storeProductImageMap[store]?.[product] ?? '';
            }
        }
    }

    handleChange() {
        this.checkedInnerNeck ? this.selectNeckImage(this.selectedItem.design) : this.artInnerNeck = '';
    }

    async saveImages() {
        try {
            if (this.artURLFront !== '') {
                const data = {
                    art: this.selectedItem.design,
                    url: this.artURLFront,
                    pod: this.selectedItem.pod_service,
                    type: this.checkedPoster ? 'poster' : 'front',
                };
                const result = await this.swiftpodService.saveArt(data);
                console.log(result);
                
            }
            if (this.artURLBack !== '') {
                const data = {
                    art: this.selectedItem.design,
                    url: this.artURLBack,
                    pod: this.selectedItem.pod_service,
                    type: 'back',
                };
                const result = await this.swiftpodService.saveArt(data);
            }
            if (this.mockupURLFront !== '') {
                const data = {
                    sku: this.selectedItem.sku,
                    url: this.mockupURLFront,
                    region: this.checkedPoster ? 'poster' : '',
                    type: this.checkedPoster ? 'poster' : 'front',
                };
                const result = await this.swiftpodService.saveMockup(data);
            }
            if (this.mockupURLBack !== '') {
                const data = {
                    sku: this.selectedItem.sku,
                    url: this.mockupURLBack,
                    region: '',
                    type: 'back',
                };
                const result = await this.swiftpodService.saveMockup(data);
            }
            if (this.artInnerNeck !== '') {
                const data = {
                    art: this.selectedItem.design,
                    url: this.artInnerNeck,
                    pod: this.selectedItem.pod_service,
                    type: 'inner_neck',
                };
                const result = await this.swiftpodService.saveArtNeck(data);
            }else{ 
                const result = await this.swiftpodService.deleteArtNeck(this.selectedItem.design); 
                console.log(result);
            }
            if (this.artOuterNeck !== '') {
                const data = {
                    art: this.selectedItem.design,
                    url: this.artOuterNeck,
                    pod: this.selectedItem.pod_service,
                    type: 'outer_neck',
                };
                const result = await this.swiftpodService.saveArtNeck(data);
            }

            this.loadData();
            this.visible = false;
            this.checkedPocket = false;

        } catch (error) {
            console.log(error);
        }
    }
}

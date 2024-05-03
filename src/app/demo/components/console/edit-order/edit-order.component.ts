import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SwiftpodService } from 'src/app/demo/service/swift.service';

@Component({
    templateUrl: './edit-order.component.html',
    styleUrls: ['./edit-order.component.scss']
})
export class EditOrderComponent implements OnInit {

    site_order_id: string;
    order: any;

    selectedItem: any;
    visible: boolean = false;

    //Front
    artURLFront: string = '';
    mockupURLFront: string = '';
    //Back
    artURLBack: string = '';
    mockupURLBack: string = '';

    shippingUrl: string = '';
    trackingCode: string = '';
    carriers: any[] = [
        { name: 'DHL Express', code: 'DHL' },
        { name: 'Estafeta', code: 'EST' },
        { name: 'Fedex', code: 'FDX' },
        { name: 'Mercado Libre', code: 'MLI' }
    ];
    selectedCarrier: any;

    constructor(private route: ActivatedRoute, private swiftpodService: SwiftpodService) { }

    async ngOnInit(): Promise<void> {
        this.loadData();
    }

    async loadData() {
        try {
            this.route.queryParams.subscribe(param => {
                this.site_order_id = param['site_order_id'];
            })
            const orders = await this.swiftpodService.getIncomingOrder();
            const filtered = orders.response.filter(item => {
                return item.site_order_id = this.site_order_id
            });
            if (filtered.length > 0)
                this.order = filtered[0];

            console.log(this.order);
        } catch (error) {
            console.log(error)
        }
    }

    showDialog(order: any) {
        this.visible = true;

        this.selectedItem = order;

        this.artURLFront = this.selectedItem.front_art_url;
        this.mockupURLFront = this.selectedItem.front_mockup_url;
        this.artURLBack = this.selectedItem.back_art_url;
        this.mockupURLBack = this.selectedItem.back_mockup_url;

        console.log(this.selectedItem);
    }

    onTextChange(event: any, field: string): void {
        const img_url: string = event.target.value;

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
            default:
                break;

        }
    }
    async saveShippingLabel(){
        if(this.shippingUrl !== '' && this.trackingCode !== '' && this.selectedCarrier){
            console.log({
                1:this.shippingUrl,
                2:this.trackingCode,
                3:this.selectedCarrier.name
            });
            
        }
    }

    async saveImages(){
        try {
            if(this.artURLFront !== ''){
                const data = {
                    art: this.selectedItem.design,
                    url: this.artURLFront,
                    pod: this.selectedItem.pod_service,
                    type: 'front'
                }
                const result = await this.swiftpodService.saveArt(data);
            }
            if(this.artURLBack !== ''){
                const data = {
                    art: this.selectedItem.design,
                    url: this.artURLBack,
                    pod: this.selectedItem.pod_service,
                    type: 'back'
                }
                const result = await this.swiftpodService.saveArt(data);
            }
            if(this.mockupURLFront !== ''){
                const data = {
                    sku: this.selectedItem.sku,
                    url: this.mockupURLFront,
                    type: 'front'
                }
                const result = await this.swiftpodService.saveMockup(data);
            }
            if(this.mockupURLBack !== ''){
                const data = {
                    sku: this.selectedItem.sku,
                    url: this.mockupURLBack,
                    type: 'back'
                }
                const result = await this.swiftpodService.saveMockup(data);
            }

            this.loadData();
            this.visible = false;

        } catch (error) {
            console.log(error);
        }
    }
}


import { Component, OnInit } from '@angular/core';
import { SwiftpodService } from '../../service/swift.service';

@Component({
    templateUrl: './console.component.html',
    styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements OnInit {

    incomingOrders: any[];

    constructor(private swiftpodService: SwiftpodService){}
    
    async ngOnInit(): Promise<void> {
        this.loadData();        
    }

    async loadData(){
        const result = await this.swiftpodService.getIncomingOrder();
        this.incomingOrders = result.response;
    }

    formatDate(date: string): string{
        let resultDate: string = '';
        if(date !== ''){
            const datePart1 = date.split('T')[0];
            const datePart2 = date.split('T')[1].split('.')[0];

            resultDate = datePart1 + ' ' + datePart2;
        }
        return resultDate;
    }

    statusFlagsImages(order:any):boolean{
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

    statusFlagsShipping(order:any):boolean{
        if (!order) {
            return false;
        }
        if(this.enableFlagShipping(order.pod_service, order.site_name)){
            if(order.shipping_label === '' || order.carrier === '' || order.tracking_code === ''){
                return false;
            }
        }
        
        return true;
    }

    enableFlagShipping(pod: string, site_name: string):boolean{
        switch(pod){
            case 'swiftpod':
                return false;
            case 'crea_tu_playera':
                if(site_name === 'Amazon Mexico' || site_name === 'Walmart'){
                    return false 
                }else{
                    return true
                }
            case 'printbar':
                return false;
            default:
                return true;
        } 
    }

    async sendOrder(order: any){
        try {
            if(order.pod_service == 'swiftpod'){
                const buildedSwiftPODOrder = this.buildSwiftPODOrder(order);
                const { response } = await this.swiftpodService.sendSwiftPODOrder(buildedSwiftPODOrder);
                console.log(response);

                if(response.status){
                    const swiftpodOrder = {
                        site_order_id: order.site_order_id,
                        order_id: order.order_id,
                        swift_id: response.data.id,
                        site_name: order.site_name,
                        date: this.formatDate(order.order_date),
                        status: 'new_order'
                    };

                    // Insertar datos en la tabla swiftpod_orders 
                    const result = await this.swiftpodService.saveSwiftPODOrder(swiftpodOrder);
                    this.loadData();
                }
            }  
        } catch (error) {
            console.log(error)
        }
        
    }

    // Build order to SwiftPOD
    buildSwiftPODOrder(order: any): any{        
        const line_items = order.items.map(item => {
            const print_files = [];
            
            if (item.front_art_url !== '') {
              print_files.push({ key: 'front', url: item.front_art_url });
            }
            if (item.back_art_url !== '') {
              print_files.push({ key: 'back', url: item.back_art_url });
            }
            if (item.inner_neck_art_url !== '') {
              print_files.push({ key: 'inner_neck_label', url: item.inner_neck_art_url });
            }
          
            return {
              order_item_id: `${item.site_order_id}_${item.sku}`,
              sku: item.pod_service_sku,
              quantity: parseInt(item.quantity, 10),
              print_files
            };
          });

        const bodyData = {
            order_id: order.site_order_id,
            test_order: true,
            order_status: "new_order",
            line_items,
            address: {
                name: order.ship_to,
                phone: order.phone,
                street1: order.address_1,
                street2: "",
                city: order.city,
                state: order.region,
                country: order.country,
                zip: order.postal_code,
                force_verified_status: true
            },
            return_address: {
                name: "Fernando Flores",
                email: "hello@smartprintsink.com",
                company: "",
                phone: "(+52) 686 125 6181",
                street1: "1153 Lincoln Road",
                street2: "",
                state: "CA",
                city: "San Jose",
                country: "US",
                zip: "95125"
            },
            shipping_method: "standard",
        };

        return bodyData;
    }
}
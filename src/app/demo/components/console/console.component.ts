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
        const result = await this.swiftpodService.getIncomingOrder();
        this.incomingOrders = result.response
        console.log(this.incomingOrders);
        
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
        if(order.shipping_label === '' || order.carrier === '' || order.tracking_code === ''){
            return false;
        }
        
        return true;
    }
}
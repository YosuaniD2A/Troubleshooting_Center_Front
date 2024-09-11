import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThePrintbarService {
    baseUrl: string = 'http://localhost:3005/the_print_bar/';

    constructor(private http: HttpClient) { }

    getIncomingOrdersTPB(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getIncomingOrdersTPB`))
    };

    sendThePrintbarOrder(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}sendOrderToThePrintbar`, { data }))
    };

    saveThePrintbarOrder(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveThePrintbarOrder`, { data }))
    };

    getOrderFromThePrintbar(orderID): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getOrderFromThePrintbar/${orderID}`))
    }

    setMongoTPBOrder(order): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}setMongoTPBOrder`, { order }))
    };

    getAllOrdersUnshipped(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getAllOrdersUnshipped`))
    };

    updateOrderUnshipped(order): Promise<any>{
        return lastValueFrom(this.http.put<any>(`${this.baseUrl}updateOrderUnshipped`, { order }))
    }

    updateOrderShipment(order): Promise<any>{
        return lastValueFrom(this.http.put<any>(`${this.baseUrl}updateOrderShipment`, { order }))
    }
}
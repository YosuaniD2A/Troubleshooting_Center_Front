import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SwiftpodService {

    baseUrl: string = 'http://localhost:3005/swiftpod/';

    constructor(private http: HttpClient) { }

    getIncomingOrder(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getIncomingOrders`))
    }

    getLinkMockup(skuBase, size): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}linkMockup`, { skuBase, size }))
    }

    getLinkArt(design, pod): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}linkArt`, { design, pod }))
    }

    saveArt(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveArt`, { data }))
    }

    saveMockup(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveMockup`, { data }))
    }

    saveArtNeck(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveArtNeck`, { data }))
    }

    deleteArtNeck(art): Promise<any> {
        return lastValueFrom(this.http.delete<any>(`${this.baseUrl}deleteArtNeck/${art}`))
    }

    saveShippingLabel(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveShippingLabel`, { data }))
    }

    //------------------------------------------------------------------------

    sendSwiftPODOrder(data, siteName): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}sendOrderToSwift/${siteName}`, { data }))
    }
    saveSwiftPODOrder(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveSwiftPODOrder`, { data }))
    }

    getSwiftPODOrder(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getSwiftPODOrder`))
    }

    getSwiftPODOrdersStatus(swift_id): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getSwiftPODOrdersStatus/${swift_id}`))
    }

    updateSwiftPODOrderStatus(order_id: string, data: any): Promise<any>{
        return lastValueFrom(this.http.put<any>(`${this.baseUrl}updateSwiftPODOrderStatus/${order_id}`, data))
    }

    getOrdersWithoutUpdate(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getOrdersWithoutUpdate`))
    }
    


}
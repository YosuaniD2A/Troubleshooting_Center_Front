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

    saveArt(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveArt`, { data }))
    }

    saveMockup(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveMockup`, { data }))
    }
}
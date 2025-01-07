import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CoppelService {
    baseUrl: string = 'http://localhost:3005/coppel/';

    constructor(private http: HttpClient) {}



    markAsShippedCoppel(order_id): Promise<any> {
        return lastValueFrom(
            this.http.get<any>(`${this.baseUrl}markAsShipped/${order_id}`)
        );
    }
}

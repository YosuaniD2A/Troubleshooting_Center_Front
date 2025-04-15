import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ListingGeneratorService {
    baseUrl: string = 'http://localhost:3005/listingGenerator/';

    constructor(private http: HttpClient) { }


    getPtosList(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getPtosList`))
    }
    
    getPTO(pto): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getPTO/${pto}`))
    }

    getLicense(sku): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getLicense/${sku}`))
    }

    getMockups(pto): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getMockups/${pto}`))
    }

    getColors(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getColors`))
    }

    getLastMPN(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getLastMPN`))
    }

    getMockupURLs(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}getMockupURLs`, { mockups: data }))
    }

    saveMockupDetails(data, pto): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveMockupDetails/${pto}`, { mockupData: data }))
    }

    getPriceRelationship(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}getPriceRelationship`, { mockupData: data }))
    }

    updatePTOs(data): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}updatePTOs`, { pto: data }))
    }
}
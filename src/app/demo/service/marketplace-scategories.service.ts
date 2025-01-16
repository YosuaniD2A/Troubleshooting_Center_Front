import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MarketplaceScategoriesService {
    constructor(private http: HttpClient) {}

    getMarketplaceCategories(): Observable<any> {
      return this.http.get<any>('assets/demo/data/marketplace-categoriesv2.json');
    }
}

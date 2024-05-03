import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreaTuPlayeraService {

  baseUrl: string = 'http://localhost:3005/crea_tu_playera/';

  constructor(private http: HttpClient) { }

  getCTPOrders(): Promise<any>{
    return lastValueFrom(this.http.get<any>(`${this.baseUrl}getCTPOrdersStatus`))
  }

  getKornitXOrders(order_id: string): Promise<any>{
    return lastValueFrom(this.http.get<any>(`${this.baseUrl}getKornitXOrdersStatus/${order_id}`))
  }

  updateCTPOrders(order_id: string, data: any): Promise<any>{
    return lastValueFrom(this.http.put<any>(`${this.baseUrl}updateCTPOrderStatus/${order_id}`, data))
  }


}
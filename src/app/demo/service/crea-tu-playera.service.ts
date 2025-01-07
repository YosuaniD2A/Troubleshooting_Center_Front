import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreaTuPlayeraService {

  baseUrl: string = 'http://localhost:3005/crea_tu_playera/';

  constructor(private http: HttpClient) { }

  getIncomingOrdersCTP(site_order_id): Promise<any>{
    return lastValueFrom(this.http.get<any>(`${this.baseUrl}getIncomingOrdersCTP/${site_order_id}`))
  }

  getCTPOrders(): Promise<any>{
    return lastValueFrom(this.http.get<any>(`${this.baseUrl}getCTPOrdersStatus`))
  }

  getKornitXOrders(order_id: string): Promise<any>{
    return lastValueFrom(this.http.get<any>(`${this.baseUrl}getKornitXOrdersStatus/${order_id}`))
  }

  updateCTPOrders(order_id: string, data: any): Promise<any>{
    return lastValueFrom(this.http.put<any>(`${this.baseUrl}updateCTPOrderStatus/${order_id}`, data))
  }

  sendCTPOrder(data): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.baseUrl}sendOrderToCTP`, data))

  }
  
  saveCTPOrder(data): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveCTPOrder`, data))
  }

  setMongoCTPOrder(data): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.baseUrl}setMongoCTPOrder`, data))
  }

  processOrdersWithoutUpdate(data): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.baseUrl}processOrdersWithoutUpdate`, data))
  }

}
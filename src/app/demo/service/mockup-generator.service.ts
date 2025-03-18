import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MockupGeneratorService {
    baseUrl: string = 'http://localhost:3005/mockupGenerator/';

    constructor(private http: HttpClient) { }


    generateMockups(files: File[], data: any): Promise<any> {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('files', file, file.name);
        });
    
        formData.append('data', JSON.stringify(data));
    
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}sendToRenderMockups`, formData));
    }

    updateMockups(): Promise<any>{
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}getMockupsFromDynamic`));
    }; 
    
    getColorsBySTyle(style): Promise<any>{
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}getColorsByStyle`, { style }));
    }; 
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class InfoGeneratorService {
    baseUrl: string = 'http://localhost:3005/infoGenerator/';

    constructor(private http: HttpClient) { }


    generateInfo_GPT(files: File[]): Promise<any> {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('files', file, file.name);
        });
    
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}generateInfoGPT`, formData));
    }

    saveMetadata(data: any): Promise<any> {    
        return lastValueFrom(this.http.post<any>(`${this.baseUrl}saveMetadata`, data));
    }

}
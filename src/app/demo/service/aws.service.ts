import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AWSService {
    baseUrl: string = 'http://localhost:3005/aws/';

    constructor(private http: HttpClient) {}

    upload(files: File[], data: any): Promise<any> {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('files', file, file.name);
        });

        formData.append('data', JSON.stringify(data));

        return lastValueFrom(
            this.http.post<any>(`${this.baseUrl}uploadImageToAWS`, formData)
        );
    }

    saveUrls(data): Promise<any> {
        return lastValueFrom(
            this.http.post<any>(`${this.baseUrl}saveUrls`, data)
        );
    }
}

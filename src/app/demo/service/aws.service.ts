import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AWSService {
    baseUrl: string = 'http://localhost:3005/aws/';

    constructor(private http: HttpClient) {}


    upload(files: File[]): Promise<any> {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('files', file, file.name);
        });

        return lastValueFrom(this.http.post<any>(`${this.baseUrl}uploadImageToAWS`, formData));

    }
}

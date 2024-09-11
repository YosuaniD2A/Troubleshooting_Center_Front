import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DropboxService {
    baseUrl: string = 'http://localhost:3005/dropbox/';

    constructor(private http: HttpClient) {}

    initAuthentication(): Promise<any> {
        return lastValueFrom(
            this.http.get<any>(`${this.baseUrl}initAuthentication/`)
        );
    }

    getMembers(): Promise<any> {
        return lastValueFrom(this.http.get<any>(`${this.baseUrl}membersList/`));
    }

    getFiles(user_id): Promise<any> {
        return lastValueFrom(
            this.http.get<any>(`${this.baseUrl}getAllFile/${user_id}`)
        );
    }

    upload(files: File[], image_type: string, pod?: string): Promise<any> {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('files', file, file.name);
        });

        let url = `${this.baseUrl}uploadImage/${image_type}`;
        if (pod) {
            url += `?pod=${encodeURIComponent(pod)}`;
        }

        return lastValueFrom(this.http.post<any>(url, formData));
        // return lastValueFrom(
        //     this.http.post<any>(
        //         `${this.baseUrl}uploadImage/${image_type}`,
        //         formData
        //     )
        // );
    }
}

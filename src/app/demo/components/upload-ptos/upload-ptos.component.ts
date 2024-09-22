import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DropboxService } from '../../service/dropbox.service';
import { FileUpload } from 'primeng/fileupload';
import { Observable, Subscription, interval, takeWhile } from 'rxjs';
import { ComponentCanDeactivate } from '../../guards/upload.guard';

interface ImagesType {
    name: string;
    param: string;
    code: string;
    accepted: string;
}

@Component({
    templateUrl: './upload-ptos.component.html',
    providers: [MessageService],
})
export class UploadPtosComponent
    implements OnInit, OnDestroy, ComponentCanDeactivate
{
    @ViewChild('uploader') uploader: FileUpload;

    files = [];
    imagesTypes: ImagesType[] | undefined;
    selectedPod: any = null;
    pods: any[] = [
        { name: 'Swift POD', value: 'swiftpod', key: 'SPOD' },
        { name: 'Crea tu playera', value: 'crea tu playera', key: 'CTP' },
        { name: 'Printbar', value: 'printbar', key: 'TPB' }
    ];

    selectedImageType: ImagesType | null = null;
    avgFileUploadTimeJPG: number = 4.25;
    avgFileUploadTimePNG: number = 6.25;

    numberOfColumns: number = 3;
    status: string = 'online';
    typeAccepted: string = '.jpg';

    uploading: boolean = false;
    uploaded: boolean = false;

    filesUploaded: any[] = [];
    timeLeft: number;
    formattedTimeLeft: string;
    private countdownSubscription: Subscription;

    constructor(
        private messageService: MessageService,
        private dropboxService: DropboxService
    ) {}

    async ngOnInit() {
        this.selectedPod = this.pods[0];
        this.imagesTypes = [
            {
                name: 'Mockups',
                param: 'mockup',
                code: 'Option 1',
                accepted: '.jpg,.jpeg',
            },
            {
                name: 'Arts (PNG)',
                param: 'art',
                code: 'Option 2',
                accepted: '.png',
            },
        ];

        await this.loadMembers();
    }

    async loadMembers() {
        try {
            const resp = await this.dropboxService.getMembers();
            if (resp.response.length > 0) {
                this.status = 'online';
            }
        } catch (error) {
            console.log(error);
            this.status = 'offline';
            this.messageService.add({
                key: 'tc',
                severity: 'error',
                summary: 'Error',
                detail: error.error.msg.error_summary,
                life: 3000,
            });
        }
    }

    async initAuthentication() {
        const resp = await this.dropboxService.initAuthentication();
        console.log(resp.authUrl);
        window.open(resp.authUrl, '_blank');
    }

    onClear() {
        this.files = [];
        this.formattedTimeLeft = '';
        this.uploaded = false;
    }

    removeFile(file): void {
        const index = this.files.indexOf(file);
        if (index > -1) {
            this.files.splice(index, 1);
        }
        if (this.files.length === 0) {
            this.uploader.clear();
        }
        console.log(this.files);
    }

    onSelectedFiles(event) {
        this.files = event.currentFiles;
        this.files = this.files.filter((file) => {
            if (file.name.includes('__')) {
                const number = file.name.split('.')[0].split('__')[1];
                return number === '101';
            }
            return file;
        });
        console.log(this.files);
    }

    async upload(event) {
        try {
            this.uploading = true;
            this.uploaded = false;

            this.startCountdown(
                this.files.length *
                    (this.selectedImageType.param === 'mockup'
                        ? this.avgFileUploadTimeJPG
                        : this.avgFileUploadTimePNG)
            );

            const result = await this.dropboxService.upload(
                event.files,
                this.selectedImageType.param,
                this.selectedPod.value
            );

            this.filesUploaded = this.filesUploaded.concat(result.response);
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'File Uploaded',
                life: 3000,
            });
            this.uploader.clear();
            this.uploading = false;
            this.uploaded = true;
        } catch (error) {
            this.uploading = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message,
                life: 3000,
            });
        }
    }

    assign(event) {
        this.uploader.clear();
        this.filesUploaded = [];
        this.selectedImageType = event.value;
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
        return `${size} ${sizes[i]}`;
    }

    getColumns() {
        const columns = [];
        const itemsPerColumn = Math.ceil(
            this.files.length / this.numberOfColumns
        );

        for (let i = 0; i < this.numberOfColumns; i++) {
            columns.push(
                this.files.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
            );
        }
        return columns;
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.uploading || this.files.length > 0) {
            const confirmLeave = window.confirm(
                'Estás a punto de cerrar esta sección y perderás todos los datos. ¿Deseas continuar?'
            );
            return confirmLeave; // Si no se esta cargando, se puede navegar
        }
        return true;
    }

    formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(secs).padStart(2, '0');

        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }

    startCountdown(seconds: number) {
        this.timeLeft = seconds;
        this.updateFormattedTime();

        this.countdownSubscription = interval(1000)
            .pipe(takeWhile(() => this.timeLeft > 0))
            .subscribe(() => {
                this.timeLeft--;
                this.updateFormattedTime();
            });
    }

    updateFormattedTime() {
        if (this.timeLeft >= 1) {
            this.formattedTimeLeft = this.formatTime(this.timeLeft);
        } else {
            this.formattedTimeLeft =
                'Loading is about to be completed, please be patient...';
        }
    }

    ngOnDestroy() {
        if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
        }
    }
}

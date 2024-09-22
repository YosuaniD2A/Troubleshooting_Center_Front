import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Subscription, interval, takeWhile } from 'rxjs';
import { AWSService } from '../../service/aws.service';
import * as FileSaver from 'file-saver';

@Component({
    templateUrl: './upload-aws-s3.component.html',
    providers: [MessageService],
})
export class UploadAWSS3Component implements OnInit, OnDestroy {
    @ViewChild('uploader') uploader: FileUpload;

    files = [];

    uploading: boolean = false;
    uploaded: boolean = false;

    filesUploaded: any[] = [];
    timeLeft: number;
    formattedTimeLeft: string;
    private countdownSubscription: Subscription;

    constructor(
        private messageService: MessageService,
        private awsService: AWSService
    ) {}

    async ngOnInit() {}

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
        console.log(this.files);
    }

    async upload(event) {
        try {
            this.uploading = true;
            this.uploaded = false;

            this.startCountdown(this.files.length * 2);

            // Iniciado el proceso de carga de AWS
            const result = await this.awsService.upload(event.files);
            this.filesUploaded = result.data.map((item) => {
                return {
                    mockup: this.extractPartOfFileName(item.img_key),
                    img_url: item.img_url,
                };
            });

            //Guardar todos los datos en la BD


            //Exportar en formato XLXS automaticamente
            this.exportExcel(this.filesUploaded);
            console.log(this.filesUploaded);

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

    extractPartOfFileName(fileName) {
        // Utilizamos una expresión regular para obtener la parte deseada del nombre del archivo
        const regex = /-(.+?)__/;
        const match = fileName.match(regex);

        if (match && match[1]) {
            return match[1]; // Devuelve la parte entre el guión '-' y el doble guión '__'
        }

        return ''; // Devuelve un string vacío si no hay coincidencia
    }

    exportExcel(data: any) {
        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(data);
            const workbook = {
                Sheets: { data: worksheet },
                SheetNames: ['data'],
            };
            const excelBuffer: any = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });
            this.saveAsExcelFile(excelBuffer, 'ptos');
        });
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        let EXCEL_TYPE =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], {
            type: EXCEL_TYPE,
        });
        FileSaver.saveAs(
            data,
            fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
        );
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
        return `${size} ${sizes[i]}`;
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

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
    buckets = [];
    selectedBucket = {
        name: 'PTOS_URL',
        param: 'ptos-url',
    };

    uploading: boolean = false;
    uploaded: boolean = false;

    filesUploaded: any[] = [];
    timeLeft: number;
    formattedTimeLeft: string;
    private countdownSubscription: Subscription;

    constructor(
        private messageService: MessageService,
        private awsService: AWSService
    ) { }

    async ngOnInit() {
        this.buckets = [
            {
                name: 'PTOS_URL',
                param: 'ptos-url',
            },
            {
                name: 'CHART_SIZE',
                param: 'chart-size',
            }
        ]
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
        console.log(this.files);
    }

    assign(event) {
        this.selectedBucket = event.value;
    }

    // async upload(event) {
    //     try {
    //         this.uploading = true;
    //         this.uploaded = false;

    //         const files = event.files;
    //         const batchSize = 100; // Tamaño del lote (puedes ajustarlo según tus necesidades)
    //         const delayBetweenBatches = 10000; // Retraso entre lotes en milisegundos (10 segundos)
    //         this.startCountdown(files.length * 2);

    //         const sizes = ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"];

    //         const sizesToddler = ["02T", "03T", "04T", "05T"];

    //         const sizesYouth = ["0XS", "00S", "00M", "00L", "0XL"];

    //         const sizesBaby = ["0NB", "06M", "12M", "18M", "24M"];

    //         // Función para introducir un retraso
    //         const delay = (ms) =>
    //             new Promise((resolve) => setTimeout(resolve, ms));

    //         // Dividir archivos en lotes y subirlos con un retraso entre cada lote
    //         const uploadBatches = async () => {
    //             for (let i = 0; i < files.length; i += batchSize) {
    //                 const batch = files.slice(i, i + batchSize);

    //                 // Enviar el lote actual
    //                 const result = await this.awsService.upload(batch);

    //                 // Procesar los resultados del lote actual
    //                 const uploadedFiles = result.data.flatMap((item) => {
    //                     // Usamos extractMockupBase para obtener el mockup base sin la talla
    //                     const mockupBase = this.extractMockupBase(item.img_key);

    //                     // Generar variantes para todas las tallas
    //                     return sizes.map((size) => ({
    //                         mockup: `${mockupBase}${size}`,
    //                         img_url: item.img_url,
    //                     }));
    //                 });
    //                 // const uploadedFiles = result.data.map((item) => {
    //                 //     return {
    //                 //         mockup: this.extractPartOfFileName(item.img_key),
    //                 //         img_url: item.img_url,
    //                 //     };
    //                 // });

    //                 // Guardar los datos en la BD
    //                 await Promise.all(
    //                     uploadedFiles.map((data) =>
    //                         this.awsService.saveUrls(data)
    //                     )
    //                 );

    //                 // Unir archivos subidos de diferentes lotes
    //                 this.filesUploaded = [
    //                     ...(this.filesUploaded || []),
    //                     ...uploadedFiles,
    //                 ];

    //                 // Agregar retraso antes del siguiente lote
    //                 await delay(delayBetweenBatches);
    //             }
    //         };

    //         // Iniciar el proceso de carga por lotes
    //         await uploadBatches();

    //         const groupedList = this.groupByMockup(this.filesUploaded);

    //         // Exportar en formato XLXS automáticamente después de la carga completa
    //         this.exportExcel(groupedList);
    //         console.log(groupedList);

    //         this.messageService.add({
    //             severity: 'success',
    //             summary: 'Success',
    //             detail: 'Files uploaded successfully',
    //             life: 3000,
    //         });

    //         this.uploader.clear();
    //         this.uploading = false;
    //         this.uploaded = true;
    //     } catch (error) {
    //         this.uploading = false;
    //         this.messageService.add({
    //             severity: 'error',
    //             summary: 'Error',
    //             detail: error.message,
    //             life: 3000,
    //         });
    //     }
    // }

    async upload(event) {
        try {
            this.uploading = true;
            this.uploaded = false;

            const files = event.files;
            const batchSize = 100;
            const delayBetweenBatches = 10000;
            this.startCountdown(files.length * 2);

            const sizesAdult = ["00S", "00M", "00L", "0XL", "2XL", "3XL", "4XL", "5XL"];
            const sizesToddler = ["02T", "03T", "04T", "05T"];
            const sizesYouth = ["0XS", "00S", "00M", "00L", "0XL"];
            const sizesBaby = ["0NB", "06M", "12M", "18M", "24M"];

            const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

            const uploadBatches = async () => {
                for (let i = 0; i < files.length; i += batchSize) {
                    const batch = files.slice(i, i + batchSize);

                    //TODO: Poner aqui una condicion para procesar las imagenes segun el Bucket de destino,
                    // por default ira a PTO_URL
                    if (this.selectedBucket && this.selectedBucket.name == "PTOS_URL") {
                        const result = await this.awsService.upload(batch, this.selectedBucket.param);
                        console.log(result);

                        const uploadedFiles = result.data.flatMap((item) => {
                            const mockupBase = this.extractMockupBase(item.img_key);

                            // Detectar tipo de talla según el mockup
                            const sizes = mockupBase.includes("YO")
                                ? sizesYouth
                                : mockupBase.includes("TO")
                                    ? sizesToddler
                                    : mockupBase.includes("BB")
                                        ? sizesBaby
                                        : sizesAdult;

                            return sizes.map((size) => ({
                                mockup: `${mockupBase}${size}`,
                                img_url: item.img_url,
                            }));
                        });

                        await Promise.all(
                            uploadedFiles.map((data) =>
                                this.awsService.saveUrls(data)
                            )
                        );

                        this.filesUploaded = [
                            ...(this.filesUploaded || []),
                            ...uploadedFiles,
                        ];
                    } else if (this.selectedBucket && this.selectedBucket.name == "CHART_SIZE") {
                        const result = await this.awsService.upload(batch, this.selectedBucket.param);
                        console.log(result);

                        const uploadedFiles = result.data.flatMap((item) => {
                            const fileName = this.extractFileName(item.img_key);
                            return {
                                mockup: `${fileName}`,
                                img_url: item.img_url,
                            }
                        });

                        this.filesUploaded = [
                            ...(this.filesUploaded || []),
                            ...uploadedFiles,
                        ];
                    }

                    await delay(delayBetweenBatches);
                }
            };

            await uploadBatches();

            const groupedList = this.groupByMockup(this.filesUploaded);
            this.exportExcel(groupedList);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Files uploaded successfully',
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


    extractMockupBase(fileName: string) {
        const fileNamePart = fileName.substring(fileName.lastIndexOf('/') + 1);

        // Dividir el nombre en dos partes alrededor del primer guion '-'
        const dashIndex = fileNamePart.indexOf('-');
        const underscoreIndex = fileNamePart.indexOf('__');

        // Si se encuentran tanto el guion como el '__', extraer la base del mockup
        if (dashIndex !== -1 && underscoreIndex !== -1) {
            // Obtener la parte entre el guion y '__', eliminando los últimos tres caracteres
            const mockupBase = fileNamePart.substring(dashIndex + 1, underscoreIndex - 3);
            return mockupBase;
        }

        return '';
    }

    extractFileName(fileName: string) {
        const fileNamePart = fileName.substring(fileName.lastIndexOf('/') + 1);
        const parts = fileNamePart.split('-');

        // Verificar que hay al menos dos partes y quitar la extensión si existe
        if (parts.length > 1) {
            return parts[1].replace(/\.[^.]+$/, ''); // Elimina la extensión del archivo
        }

        return '';
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

    groupByMockup(files) {
        const result = files.reduce((acc, file) => {
            if (!acc[file.mockup]) {
                acc[file.mockup] = { mockup: file.mockup };
            }

            const mockupCount = Object.keys(acc[file.mockup]).length;
            acc[file.mockup][`img_url${mockupCount}`] = file.img_url;

            return acc;
        }, {});

        return Object.values(result);
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

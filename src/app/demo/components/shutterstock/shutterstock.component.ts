import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { Product } from '../../api/product';
import { Table } from 'primeng/table';
import { MessageService, MenuItem, Message } from 'primeng/api';
import { ShutterstockService } from '../../service/shutterstock.service';
import { FileUpload } from 'primeng/fileupload';
import { imageMetadata } from '../../interfaces/imageMetadata.interface';
import { Subscription, interval } from 'rxjs';

interface UploadEvent {
    originalEvent: Event;
    files: File[];
}

@Component({
    templateUrl: './shutterstock.component.html',
    providers: [MessageService]
})
export class ShutterstockComponent implements OnInit, OnDestroy  {

    @ViewChild('uploader') uploader: FileUpload;

    items: MenuItem[] = [];

    // productDialog: boolean = false;

    // deleteProductDialog: boolean = false;

    // deleteProductsDialog: boolean = false;

    // selectedProducts: Product[] = [];

    // submitted: boolean = false;

    messagesInfo: Message[] | undefined;
    messagesInfoReport: Message[] | undefined;
    messagesWarn: Message[] | undefined;
    messagesError: Message[] | undefined;

    imageList: imageMetadata[] = [];

    imagesWithErrors: any[] = [];

    products: Product[] = [];

    product: Product = {};

    dropdownItems: any[] = [];

    cols: any[] = [];

    statuses: any[] = [];

    selectedImageType: any = {};

    selectedFile: boolean = false;

    rowsPerPageOptions = [5, 10, 20];

    downloable: boolean = false;

    report: any[] = [];

    isRotated = false;

    countdownMessage: string = '';

    countdownSubscription: Subscription;

    constructor(
        private messageService: MessageService,
        private shutterstockService: ShutterstockService) { }

    async ngOnInit() {
        const targetHour = 10;
        const targetMinute = 0;
        const targetSecond = 0;

        this.countdownSubscription = interval(1000).subscribe(() => {
            // Obtén la fecha y hora actual
            const now = new Date();

            // Configura la fecha y hora objetivo
            const targetDate = new Date(now);
            targetDate.setHours(targetHour, targetMinute, targetSecond);

            // Calcula la diferencia en milisegundos
            const timeDiff = targetDate.getTime() - now.getTime();

            // Calcula las horas, minutos y segundos restantes
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const secondsRemaining = Math.floor((timeDiff % (1000 * 60)) / 1000);

            // Construye el mensaje con el contador regresivo
            if (hoursRemaining < 0){
                this.countdownMessage = `Realice un REFRESH, para cargar los datos`;
            }else{
                this.countdownMessage = `Tiempo restante: ${hoursRemaining}:${minutesRemaining}:${secondsRemaining}.`;
            }
          
        });

        this.messagesInfo = [{ severity: 'info', summary: 'Info', detail: 'No hay datos cargados' }];
        this.messagesInfoReport = [{ severity: 'info', summary: 'Info', detail: `No se ha generado el reporte aún:  ${this.countdownMessage}` }];
        this.messagesWarn = [{ severity: 'warn', summary: 'Warning', detail: `Se han detectado varios elementos con problemas` }];
        this.messagesError = [{ severity: 'error', summary: 'Error', detail: 'Los datos cargados son erroneos' }];

        this.dropdownItems = [
            { name: 'Commercial', code: 'Option 1' },
            { name: 'Editorial', code: 'Option 2' }
        ];

        this.cols = [
            { field: 'shutterstock_id', header: 'Image ID' },
            { field: 'description', header: 'Description' },
            { field: 'categories', header: 'Categories' },
            { field: 'keywords', header: 'Keywords' },
            { field: 'displayname', header: 'Displayname' },
            { field: 'is_licensable', header: 'Licensable' },
            { field: 'filename', header: 'Filename' }
        ];

        this.statuses = [
            { label: 'INSTOCK', value: 'instock' },
            { label: 'LOWSTOCK', value: 'lowstock' },
            { label: 'OUTOFSTOCK', value: 'outofstock' }
        ];

        this.items = [
            {
                label: 'Save only', icon: 'pi pi-save', command: () => {
                    this.save();
                }
            },
            {
                label: 'Save & Download', icon: 'pi pi-download', command: () => {
                    this.download();
                }
            },
            {
                label: 'Download erroneous item', icon: 'pi pi-file-excel', command: () => {
                    this.exportToCSV();
                }
            }
        ];

        this.getReport();
    }

    async getReport(){
        this.isRotated = false;
        // this.report = await this.shutterstockService.getReportData(this.get30DaysAgoDate());
        this.rotateOnClick();
    }

    rotateOnClick() {
        this.isRotated = true;
    }

    ngOnDestroy() {
        // Cancela la suscripción al destruir el componente
        if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    get30DaysAgoDate(): string {
        const fechaActual = new Date();
        fechaActual.setDate(fechaActual.getDate() - 30);

        const year = fechaActual.getFullYear();
        const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const day = String(fechaActual.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    async onFileSelected(event: any) {
        try {
            this.selectedFile = true
            const file = event.currentFiles[0];
            const response = await this.shutterstockService.uploadCSV(file, this.selectedImageType.name);

            this.imageList = response.data.filter((image) => {
                return image !== null
            })

            this.imagesWithErrors = response.listErrorsIDs

            console.log(response)
            if (this.imageList.length > 0) {
                this.downloable = true;
                this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Archivo cargado satisfactoriamente' });
            }
        } catch (error) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Error', detail: error.message });
        }
    }

    cleanUploader() {
        this.uploader.clear();
        this.selectedFile = false;
        this.imageList = [];
        this.imagesWithErrors = [];
    }

    async save() {
        try {
            const data = {
                imageType: this.selectedImageType.name,
                data: this.imageList
            }
            const response = await this.shutterstockService.saveOnly(data);
            const result = this.countSubstrings(response.data, 'existe')

            if (result.exists > 0) {
                this.messageService.add({ key: 'bc', severity: 'warn', summary: 'Warning', detail: `Se identificaron ${result.exists} existentes y ${result.satisfactory} se guardaron correctamente` });
            } else {
                this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Se guardaron todos los archivos en la Base de datos' });
            }

        } catch (error) {
            this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'Ocurrio algun tipo de error' });
        }
    }

    async download() {
        try {
            const data = {
                imageType: this.selectedImageType.name,
                data: this.imageList
            }
            const response = await this.shutterstockService.downloadAndSave(data);
            const result = this.countSubstrings(response.result, 'existe')

            if (result.exists > 0) {
                this.messageService.add({ key: 'bc', severity: 'warn', summary: 'Warning', detail: `Se identificaron ${result.exists} existentes y ${result.satisfactory} se descargaron correctamente` });
            } else {
                this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Se descargaron todos los archivos' });
            }
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrio algun tipo de error' });
        }
    }

    // downloadErroneous() {
    //     this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Data Deleted' });
    // }

    countSubstrings(stringList, text) {
        let countExists = 0;
        let countSatisfactory = 0;

        stringList.forEach(string => {
            if (string.includes(text)) {
                countExists++;
            } else {
                countSatisfactory++;
            }
        });

        return {
            exists: countExists,
            satisfactory: countSatisfactory
        };
    }

    exportToCSV() {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'id\n';
        this.imagesWithErrors.forEach(item => {
            csvContent += `${item.id}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        window.open(encodedUri);
    }
}
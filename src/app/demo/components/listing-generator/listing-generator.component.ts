import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ListingGeneratorService } from '../../service/listing-generator.service';

interface City {
    name: string;
    code: string;
}

@Component({
    selector: 'app-listing-generator',
    templateUrl: './listing-generator.component.html',
    styleUrls: ['./listing-generator.component.scss'],
    providers: [MessageService],
})
export class ListingGeneratorComponent implements OnInit {
    ptoListPanel: boolean = true;
    ptoList: any[] = [];

    configurationPanel: boolean = false;
    position: string = 'center';

    selectedMarketplace: string[] = [];
    aiActivation: boolean = false;
    // Variables temporales para almacenar los cambios
    tempSelectedMarketplace: string[] = [];
    tempAiActivation: boolean = false;

    isHovering: boolean = false;

    value: number = 50;

    ptoDesigns: any[] = [];
    selectedptoDesigns!: any;

    selectedPTO!: any;
    mockups: any[] = [];
    totalMockupsToProcess: number = 0;
    currentMockupProcessing: number = 0;
    totalMockupsToSave: number = 0;
    currentMockupSaving: number = 0;
    totalMockupsToRelate: number = 0;
    currentMockupRelated: number = 0;

    mockupsListPanel: boolean = false;
    spinnerProcessingPanel: boolean = false;
    processMessage: string = '';
    step1: string = 'step'; // Puede ser 'step', 'spinner', o 'checked'
    step2: string = 'step';
    step3: string = 'step';
    step4: string = 'step';

    cities!: City[];
    selectedCities!: City[];

    constructor(
        private messageService: MessageService,
        private listingGeneratorService: ListingGeneratorService
    ) {}

    async ngOnInit(): Promise<void> {
        this.loadSettings();
        await this.loadData();

        this.cities = [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' },
            { name: 'Istanbul', code: 'IST' },
            { name: 'Paris', code: 'PRS' },
        ];

        let interval = setInterval(() => {
            this.value = this.value + Math.floor(Math.random() * 10) + 1;
            if (this.value >= 100) {
                this.value = 100;
                clearInterval(interval);
            }
        }, 2000);

        this.ptoDesigns = Array.from({ length: 7 }).map((_, i) => `Item #${i}`);
        console.log(this.selectedPTO);
    }

    async loadData() {
        const response = await this.listingGeneratorService.getPtosList();
        this.ptoList = response.data;
        console.log(this.ptoList);
    }

    async onRowSelect(event: any) {
        const response = await this.listingGeneratorService.getPTO(
            event.data.pto
        );
        const data = response.data; // Datos recibidos del servicio
        console.log(data);

        // Agrupamos por diseño
        const groupedData = data.reduce((acc: any, item: any) => {
            const {
                path,
                design,
                estilo,
                color,
                classification,
                description,
                keywords,
                title,
            } = item; // Ajusta los nombres según los campos reales
            if (!acc[design]) {
                acc[design] = {
                    path, // Preservamos el path único por diseño
                    design,
                    styles: new Set(),
                    colors: new Set(),
                    classification: new Set(),
                    description,
                    keywords,
                    title,
                };
            }
            acc[design].styles.add(estilo || ''); // Agregamos estilos al Set
            acc[design].colors.add(color || ''); // Agregamos colores al Set
            acc[design].classification.add(classification || ''); // Agregamos colores al Set
            return acc;
        }, {});

        // Convertimos los Sets a arreglos y luego a strings separados por comas
        this.ptoDesigns = Object.values(groupedData).map((item: any) => ({
            path: item.path,
            design: item.design,
            styles: Array.from(item.styles).join(', '),
            colors: Array.from(item.colors).join(', '),
            classification: Array.from(item.classification).join(', '),
            description: item.description,
            keywords: item.keywords,
            title: item.title,
        }));

        console.log(this.ptoDesigns);
        console.log(this.selectedPTO);

        this.messageService.add({
            key: 'bc',
            severity: 'info',
            summary: 'Product Selected',
            detail: event.data.theme,
        });

        const mockupsResponse = await this.listingGeneratorService.getMockups(
            this.selectedPTO.pto
        );
        this.mockups = mockupsResponse.data;
        console.log(this.mockups);

        this.ptoListPanel = false;
    }

    async processPTO() {
        try {
            this.spinnerProcessingPanel = true;

            if (this.mockups.length === 0) {
                console.warn('No hay mockups para procesar.');
                this.spinnerProcessingPanel = false;
                return; // Finaliza la ejecución si no hay mockups
            }

            // Etapa 1: Generando URLs en AWS
            this.step1 = 'spinner'; // Etapa 1 iniciada
            this.processMessage = 'Generating url in AWS';
            const process1 = await this.processForStep1(this.mockups);
            this.step1 = 'checked'; // Etapa 1 completada

            // Etapa 2: Guardando registros en la base de datos
            this.step2 = 'spinner'; // Etapa 2 iniciada
            this.processMessage = 'Saving records in the database';
            await this.processForStep2(process1);
            this.step2 = 'checked'; // Etapa 2 completada

            // Etapa 3: Creando relaciones de precio
            this.step3 = 'spinner'; // Etapa 3 iniciada
            this.processMessage = 'Creating price relationships';
            await this.processForStep3(process1);
            this.step3 = 'checked'; // Etapa 3 completada

            // Etapa 4: Generando plantillas
            this.step4 = 'spinner'; // Etapa 4 iniciada
            this.processMessage = 'Generating templates';
            await this.processForStep4();
            this.step4 = 'checked'; // Etapa 4 completada

            this.processMessage = 'Process completed successfully';
            this.spinnerProcessingPanel = false;
        } catch (error) {
            this.spinnerProcessingPanel = false;
            console.log(error);
        }
    }

    async processForStep1(mockups) {
        this.totalMockupsToProcess = mockups.length;
        let responseUpload = [];
        for (let i = 0; i < this.totalMockupsToProcess; i++) {
            const currentMockup = mockups[i];
            this.currentMockupProcessing = i + 1;

            const response = await this.listingGeneratorService.getMockupURLs([
                currentMockup,
            ]);
            responseUpload = [...responseUpload, response.data[0]];
        }
        console.log('Respuesta de Process 1:', responseUpload);
        return responseUpload;
    }

    async processForStep2(responseUpload) {
        this.totalMockupsToSave = responseUpload.length;
        for (let i = 0; i < this.totalMockupsToSave; i++) {
            const currentMockup = responseUpload[i];
            this.currentMockupSaving = i + 1;

            const responseSave =
                await this.listingGeneratorService.saveMockupDetails([
                    currentMockup,
                ]);
            console.log('Respuesta de Process 2:', responseSave);
        }
    }

    async processForStep3(responseUpload) {
        this.totalMockupsToRelate = responseUpload.length;
        let responseRelated = [];
        for (let i = 0; i < this.totalMockupsToRelate; i++) {
            const currentMockup = responseUpload[i];
            this.currentMockupRelated = i + 1;

            const response =
                await this.listingGeneratorService.getPriceRelationship(
                    currentMockup
                );
            responseRelated.push(response);
        }
        console.log('Respuesta de Process 3:', responseRelated);
        return responseRelated;
    }

    async processForStep4() {
        return new Promise((resolve) => setTimeout(resolve, 4000)); // Simulando tiempo de espera
    }

    resetParams(){
        this.step1 = 'step'
        this.step2 = 'step'
        this.step3 = 'step'
        this.step4 = 'step'

        this.totalMockupsToProcess = 0;
        this.currentMockupProcessing = 0;
        this.totalMockupsToSave = 0;
        this.currentMockupSaving = 0;
        this.totalMockupsToRelate = 0;
        this.currentMockupRelated = 0;
    }

    openMockupsList() {
        this.mockupsListPanel = true;
    }

    showDialog(position: string) {
        this.position = position;
        this.configurationPanel = true;

        this.tempSelectedMarketplace = [...this.selectedMarketplace];
        this.tempAiActivation = this.aiActivation;
    }

    openList() {
        this.ptoListPanel = true;
        this.resetParams();
    }

    onMouseEnter() {
        this.isHovering = true;
    }

    onMouseLeave() {
        this.isHovering = false;
    }

    onSave() {
        this.selectedMarketplace = [...this.tempSelectedMarketplace];
        this.aiActivation = this.tempAiActivation;

        this.saveSettings();

        this.configurationPanel = false;
    }

    onCancel() {
        this.configurationPanel = false;
    }

    private saveSettings() {
        const settings = {
            selectedMarketplace: this.selectedMarketplace,
            aiActivation: this.aiActivation,
        };
        localStorage.setItem(
            'listingGeneratorSettings',
            JSON.stringify(settings)
        );
    }

    private loadSettings() {
        const settings = localStorage.getItem('listingGeneratorSettings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            this.selectedMarketplace = parsedSettings.selectedMarketplace || [];
            this.aiActivation = parsedSettings.aiActivation || false;
        } else {
            // Valores por defecto si no hay configuración guardada
            this.selectedMarketplace = [
                'Walmart',
                'Amazon',
                'Ebay',
                'Etsy',
                'Pipeline',
            ];
            this.aiActivation = false;
        }
    }

    get selectedMarketplaceLength(): number {
        return this.selectedMarketplace?.length || 1;
    }
}

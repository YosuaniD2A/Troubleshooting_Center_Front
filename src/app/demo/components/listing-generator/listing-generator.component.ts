import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ListingGeneratorService } from '../../service/listing-generator.service';
import { MarketplaceScategoriesService } from '../../service/marketplace-scategories.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface City {
    name: string;
    code: string;
}

interface Design {
    classification: string;
    colors: string;
    description: string;
    design: string;
    keywords: string;
    path: string;
    styles: string;
    title: string;
    theme: string;
    feature1: string;
    feature2: string;
    feature3: string;
    amazonDepart: string;
    categories: { [key: string]: any[] };
}

@Component({
    selector: 'app-listing-generator',
    templateUrl: './listing-generator.component.html',
    styleUrls: ['./listing-generator.component.scss'],
    providers: [MessageService],
})
export class ListingGeneratorComponent implements OnInit {
    // Variables para el panel de PTOs
    ptoListPanel: boolean = true;
    ptoList: any[] = [];
    selectedPTO!: any;
    mockups: any[] = [];

    // Variables para el panel de Settings
    configurationPanel: boolean = false;
    position: string = 'center';
    selectedMarketplace: string[] = [];
    aiActivation: boolean = false;
    tempSelectedMarketplace: string[] = [];
    tempAiActivation: boolean = false;
    isHovering: boolean = false;

    //Variables de PTOs
    ptoDesigns: any[] = [];

    //Variables de categorias de marketplaces
    marketplacesCategories: { [key: string]: any } = {};

    // Variables para el proceso de ejecucion
    totalMockupsToProcess: number = 0;
    currentMockupProcessing: number = 0;
    totalMockupsToSave: number = 0;
    currentMockupSaving: number = 0;
    totalMockupsToRelate: number = 0;
    currentMockupRelated: number = 0;
    mockupsListPanel: boolean = false;
    spinnerProcessingPanel: boolean = false;
    processMessage: string = '';
    step1: string = 'step';
    step2: string = 'step';
    step3: string = 'step';
    step4: string = 'step';

    //Variables de link & unlink
    theme: string = '';
    generalKeywords: string = '';
    generalDescription: string = '';
    generalFeature1: string = '';
    generalFeature2: string = '';
    generalFeature3: string = '';
    generalAmazonDepart: any | undefined;
    linkKeywords: boolean = false;
    linkDescription: boolean = false;
    linkFeature1: boolean = false;
    linkFeature2: boolean = false;
    linkFeature3: boolean = false;
    linkAmazonDepart: boolean = false;
    linkStatus: { [market: string]: boolean } = {};
    faireCategorie: string;
    designCategories: { [design: string]: { [marketplace: string]: any[] } } =
        {};

    //Otras variables generales
    value: number = 50;
    errors: string[] = [];
    activeMessage: boolean = false;
    colors: any[] = [];
    amazonDepartmentNames: any[] = [
        { name: 'Mens' },
        { name: 'Womens' },
        { name: 'Girls' },
        { name: 'Boys' },
        { name: 'Infants' },
        { name: 'Toddlers' },
    ];
    issues: string[] = [];

    constructor(
        private messageService: MessageService,
        private listingGeneratorService: ListingGeneratorService,
        private marketplaceCategoriesService: MarketplaceScategoriesService
    ) { }

    async ngOnInit(): Promise<void> {
        this.loadSettings();
        await this.initializeData();
        await this.loadData();

        let interval = setInterval(() => {
            this.value = this.value + Math.floor(Math.random() * 10) + 1;
            if (this.value >= 100) {
                this.value = 100;
                clearInterval(interval);
            }
        }, 2000);

        this.ptoDesigns = Array.from({ length: 7 }).map((_, i) => `Item #${i}`);
    }

    async loadData() {
        const response = await this.listingGeneratorService.getPtosList();
        this.ptoList = response.data;

        this.marketplaceCategoriesService.getMarketplaceCategories().subscribe(
            (data) => {
                this.marketplacesCategories = data;
            },
            (error) => {
                console.error('Error loading marketplace categories:', error);
            }
        );
    }

    switchLinks(field: string): void {
        const marketplaceFields = this.selectedMarketplace.map((m) =>
            m.toLowerCase()
        );

        if (marketplaceFields.includes(field.toLowerCase())) {
            this.linkStatus[field] = !this.linkStatus[field];
            console.log(this.linkStatus);

        } else {
            // No es un marketplace
            switch (field.toLowerCase()) {
                case 'keywords':
                    this.linkKeywords = !this.linkKeywords;
                    return;
                case 'description':
                    this.linkDescription = !this.linkDescription;
                    return;
                case 'feature1':
                    this.linkFeature1 = !this.linkFeature1;
                    return;
                case 'feature2':
                    this.linkFeature2 = !this.linkFeature2;
                    return;
                case 'feature3':
                    this.linkFeature3 = !this.linkFeature3;
                    return;

                default:
                    return;
            }
        }
    }

    linkSelector(field: string): boolean {
        const marketplaceFields = this.selectedMarketplace.map((m) =>
            m.toLowerCase()
        );

        if (marketplaceFields.includes(field.toLowerCase()))
            return this.linkStatus[field];

        switch (field.toLowerCase()) {
            case 'keywords':
                return this.linkKeywords;
            case 'description':
                return this.linkDescription;
            case 'feature1':
                return this.linkFeature1;
            case 'feature2':
                return this.linkFeature2;
            case 'feature3':
                return this.linkFeature3;

            default:
                return false;
        }
    }

    synchronizeData() {
        this.synchronizeMarketplace();
        this.synchronizeDesignInfo();
    }

    synchronizeMarketplace(): void {
        for (const market in this.linkStatus) {
            if (this.linkStatus[market]) {
                const commonSelection = this.designCategories[market];
                this.ptoDesigns.forEach((design) => {
                    design.categories[market] = commonSelection;
                });
            }
        }
    }

    synchronizeDesignInfo(): void {
        this.ptoDesigns.forEach((design) => {
            if (this.linkKeywords) design.keywords = this.generalKeywords;
            if (this.linkDescription)
                design.description = this.generalDescription;
            if (this.linkFeature1) design.feature1 = this.generalFeature1;
            if (this.linkFeature2) design.feature2 = this.generalFeature2;
            if (this.linkFeature3) design.feature3 = this.generalFeature3;
            design.amazonDepart = this.generalAmazonDepart
                ? this.generalAmazonDepart.name
                : '';
            design.theme = this.theme;
        });
    }

    async onRowSelect(event: any) {
        this.resetParams();

        try {
            const response = await this.listingGeneratorService.getPTO(
                event.data.pto
            );
            const data = response.data; // Datos recibidos del servicio

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
                feature1: '',
                feature2: '',
                feature3: '',
                keywords: item.keywords,
                title: item.title,
                theme: '',
                amazonDepart: '',
                categories: this.selectedMarketplace.reduce((acc, market) => {
                    acc[market] = []; // Inicializa categories por marketplace
                    return acc;
                }, {}),
            }));

            this.messageService.add({
                key: 'bc',
                severity: 'info',
                summary: 'Product Selected',
                detail: event.data.theme,
            });

            const mockupsResponse =
                await this.listingGeneratorService.getMockups(
                    this.selectedPTO.pto
                );
            this.mockups = mockupsResponse.data;

            this.ptoListPanel = false;
        } catch (error) {
            this.ptoListPanel = false;
            this.messageService.add({
                key: 'bc',
                severity: 'error',
                summary: 'An error has occurred',
                detail: error.message,
            });
        }
    }

    async initializeData() {
        this.designCategories = this.selectedMarketplace.reduce(
            (acc, market) => {
                acc[market] = []; // Inicializa categories por marketplace
                return acc;
            },
            {}
        );

        this.selectedMarketplace.forEach((market) => {
            this.linkStatus[market] = false; // Inicializa desincronizado
        });

        const colorsResponse = await this.listingGeneratorService.getColors();
        this.colors = colorsResponse.data;
    }

    validateDesigns(designs: Design[]): string[] {
        this.issues = [];
        const seenTitles: { [key: string]: boolean } = {};

        designs.forEach((design) => {
            const emptyFields: string[] = [];

            // Validar campos principales
            if (!design.classification) emptyFields.push('classification');
            if (!design.colors) emptyFields.push('colors');
            if (!design.description) emptyFields.push('description');
            if (!design.keywords) emptyFields.push('keywords');
            if (!design.path) emptyFields.push('path');
            if (!design.styles) emptyFields.push('styles');
            if (!design.title) emptyFields.push('title');
            if (!design.theme) emptyFields.push('theme');
            if (this.selectedMarketplace.includes('Amazon')) {
                if (!design.amazonDepart) emptyFields.push('amazon department');
            }
            if (!design.feature1) emptyFields.push('feature 1');
            if (!design.feature2) emptyFields.push('feature 2');
            if (!design.feature3) emptyFields.push('feature 3');

            // Validar categorías
            Object.entries(design.categories).forEach(([market, categories]) => {
                if (!categories) {
                    emptyFields.push(`categories.${market}`);
                }
                if (
                    this.selectedMarketplace.includes(market) &&
                    categories && // Verificar que categories no es undefined
                    categories.length === 0
                ) {
                    emptyFields.push(`categories.${market}`);
                }
            });

            // Si hay campos vacíos, agregar al reporte
            if (emptyFields.length > 0) {
                this.issues.push(
                    `Design "${design.design
                    }" has empty fields: ${emptyFields.join(', ')}`
                );
            }

            // Validar títulos duplicados
            if (design.title) {
                if (seenTitles[design.title]) {
                    this.issues.push(
                        `Design "${design.design}" has title duplicated`
                    );
                } else {
                    seenTitles[design.title] = true; // Marcar como visto
                }
            }
        });

        return this.issues;
    }

    uniqueTitle(title: string, design: string) {
        const matchingTitles = this.ptoDesigns.filter(
            (design) => design.title === title
        );

        if (matchingTitles.length > 1) {
            return false;
        }

        return true;
    }

    getColorNameByPodCode(pod_code) {
        const colorObj = this.colors.find((item) => item.pod_code === pod_code);
        return colorObj ? colorObj.color : '';
    }

    resetParams() {
        this.step1 = 'step';
        this.step2 = 'step';
        this.step3 = 'step';
        this.step4 = 'step';

        this.totalMockupsToProcess = 0;
        this.currentMockupProcessing = 0;
        this.totalMockupsToSave = 0;
        this.currentMockupSaving = 0;
        this.totalMockupsToRelate = 0;
        this.currentMockupRelated = 0;

        this.linkDescription = false;
        this.linkKeywords = false;
        this.linkFeature1 = false;
        this.linkFeature2 = false;
        this.linkFeature3 = false;
        for (let key in this.linkStatus) {
            if (this.linkStatus.hasOwnProperty(key)) {
                this.linkStatus[key] = false;
            }
        }

        this.generalKeywords = '';
        this.generalDescription = '';
        this.generalFeature1 = '';
        this.generalFeature2 = '';
        this.generalFeature3 = '';
        this.designCategories = {};
        this.theme = '';
        this.generalAmazonDepart = undefined;
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

    async processPTO() {
        try {
            this.activeMessage = false;
            this.synchronizeData();
            this.validateDesigns(this.ptoDesigns);
            if (this.issues.length > 0) {
                this.activeMessage = true;
            } else {
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
                // Etapa 3: Creando relaciones de precio y asignacion de mpn y mrsp
                this.step3 = 'spinner'; // Etapa 3 iniciada
                this.processMessage = 'Creating price relationships';
                const process3 = await this.processForStep3(process1);
                this.step3 = 'checked'; // Etapa 3 completada
                // Etapa 4: Generando plantillas
                this.step4 = 'spinner'; // Etapa 4 iniciada
                this.processMessage = 'Generating templates';
                await this.processForStep4(process3, this.ptoDesigns);
                this.step4 = 'checked'; // Etapa 4 completada
                this.processMessage = 'Process completed successfully';
                this.spinnerProcessingPanel = false;
            }
        } catch (error) {
            this.spinnerProcessingPanel = false;
            console.log(error);
        }
    }

    //-------------------------- Steps of the Listing Generate Processs -----------------------------------

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

        const lastMPNResult = await this.listingGeneratorService.getLastMPN();

        let currentMPN =
            lastMPNResult.data.length > 0 && lastMPNResult.data[0].mpn
                ? parseInt(lastMPNResult.data[0].mpn)
                : 0;

        for (let i = 0; i < this.totalMockupsToSave; i++) {
            const currentMockup = responseUpload[i];
            this.currentMockupSaving = i + 1;
            currentMPN += 1;
            // Incrementar el MPN e incluirlo en cada size del mockup
            currentMockup.sizes = currentMockup.sizes.map((size) => {
                currentMPN += 1; // Incrementa el MPN
                return {
                    ...size,
                    mpn: currentMPN, // Agrega el MPN al objeto size
                };
            });

            await this.listingGeneratorService.saveMockupDetails(
                [currentMockup],
                this.selectedPTO.pto
            );
        }

        this.ptoDesigns = this.ptoDesigns.map((design) => ({
            ...design,
            pto: this.selectedPTO.pto,
        }));

        for (let j = 0; j < this.ptoDesigns.length; j++) {
            await this.listingGeneratorService.updatePTOs(this.ptoDesigns);
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

    async processForStep4(child_data: any[], parents_data: any[]) {
        try {
            const masterList = this.generateMasterList(
                child_data,
                parents_data
            );

            const wb: XLSX.WorkBook = XLSX.utils.book_new();

            if (this.selectedMarketplace.includes('Ebay')) {
                const wsEbay = this.generateEbayTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsEbay, 'Ebay Template');
            }
            if (this.selectedMarketplace.includes('Walmart')) {
                const wsWalmart = this.generateWalmartTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsWalmart, 'Walmart Template');
            }
            if (this.selectedMarketplace.includes('Amazon')) {
                const wsAmazon = this.generateAmazonTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsAmazon, 'Amazon Template');
            }
            if (this.selectedMarketplace.includes('Pipeline')) {
                const wsPipeline = this.generatePipelineTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsPipeline, 'Pipeline Template');
            }
            if (this.selectedMarketplace.includes('Shopify')) {
                const wsShopify = this.generateShopifyTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsShopify, 'Shopify Template');
            }
            if (this.selectedMarketplace.includes('Faire')) {
                const wsFaire = this.generateFaireTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsFaire, 'Faire Template');
            }

            // Guardar el archivo Excel combinado
            const excelBuffer: any = XLSX.write(wb, {
                bookType: 'xlsx',
                type: 'array',
            });
            const dataBlob: Blob = new Blob([excelBuffer], {
                type: 'application/octet-stream',
            });
            saveAs(dataBlob, 'Marketplaces_Templates.xlsx');

            // if (this.selectedMarketplace.includes('Ebay')) {
            //     this.generateEbayTemplate(masterList);
            // }
            // if (this.selectedMarketplace.includes('Walmart')) {
            //     this.generateWalmartTemplate(masterList);
            // }
            // if (this.selectedMarketplace.includes('Amazon')) {
            //     this.generateAmazonTemplate(masterList);
            // }
            // if (this.selectedMarketplace.includes('Pipeline')) {
            //     this.generatePipelineTemplate(masterList);
            // }
            // if (this.selectedMarketplace.includes('Shopify')) {
            //     this.generateShopifyTemplate(masterList);
            // }
            // if (this.selectedMarketplace.includes('Faire')) {
            //     this.generateFaireTemplate(masterList);
            // }

            this.resetParams();
            this.loadData();
            this.ptoDesigns = [];
            this.messageService.add({
                key: 'bc',
                severity: 'success',
                summary: 'PTO processed',
                detail: 'The PTO has been successfully processed and the corresponding templates have been imported.',
            });
        } catch (error) {
            this.messageService.add({
                key: 'bc',
                severity: 'error',
                summary: 'An error has occurred',
                detail: error.message,
            });
        }
    }

    //--------------------------- End Process --------------------------------------------------------------

    generateMasterList(responseRelationship: any[], designs: any[]) {
        const masterList: Record<string, any> = {}; // Usar un objeto para evitar duplicados en `parent_sku`

        for (const design of designs) {
            // Dividir las clasificaciones y procesar cada una
            const classifications = design.classification
                .split(',')
                .map((cls: string) => cls.trim());

            for (const classification of classifications) {
                // Filtrar detalles relacionados con la clasificación actual
                const relatedDetails = responseRelationship.filter(
                    (item) =>
                        item.design === design.design.slice(2) && // Extraer código de diseño sin prefijo
                        item.classification === classification
                );

                for (const detail of relatedDetails) {
                    // Si el `parent_sku` ya existe, agregar más hijos
                    if (masterList[detail.parent_sku]) {
                        masterList[detail.parent_sku].childrens.push(
                            ...detail.sizes.map((size) => ({
                                full_sku: size.full_sku,
                                color: this.getColorNameByPodCode(size.color),
                                size: size.size.replace(/^0+/, ''),
                                price: size.price,
                                msrp: size.msrp,
                                mpn: size.mpn,
                                image1: size.urls[0] ? size.urls[0] : '',
                                image2: size.urls[1] ? size.urls[1] : '',
                                image3: size.urls[2] ? size.urls[2] : '',
                                image4: this.assignFourthImage(classification, design.styles),
                            }))
                        );
                    } else {
                        // Crear un nuevo `parent_sku`
                        masterList[detail.parent_sku] = {
                            pto: design.pto,
                            parent_sku: detail.parent_sku,
                            title: design.title,
                            theme: design.theme,
                            description: design.description,
                            classification: classification,
                            feature1: design.feature1,
                            feature2: design.feature2,
                            feature3: design.feature3,
                            keywords: design.keywords,
                            styles: design.styles,
                            amazonDepart: design.amazonDepart,
                            categories: Object.fromEntries(
                                Object.entries(design.categories).map(
                                    ([marketplace, categoryArray]) => [
                                        marketplace,
                                        Array.isArray(categoryArray)
                                            ? Array.from(
                                                new Set(categoryArray)
                                            ).join(', ')
                                            : '',
                                    ]
                                )
                            ),
                            childrens: detail.sizes.map((size) => ({
                                full_sku: size.full_sku,
                                color: this.getColorNameByPodCode(size.color),
                                size: size.size.replace(/^0+/, ''),
                                price: size.price,
                                msrp: size.msrp,
                                mpn: size.mpn,
                                image1: size.urls[0] ? size.urls[0] : '',
                                image2: size.urls[1] ? size.urls[1] : '',
                                image3: size.urls[2] ? size.urls[2] : '',
                                image4: this.assignFourthImage(classification, design.styles),
                            })),
                        };
                    }
                }
            }
        }

        // Convertir `masterList` en un array
        return Object.values(masterList);
    }

    assignFourthImage(classification, style) {
        const urls = {
            ME: {
                "T-shirt": "https://d3d71ba2asa5oz.cloudfront.net/12044225/images/new-tshirt-wotsa__100.jpg",
                "Long Sleeve": "https://cdn.shopify.com/s/files/1/0067/6148/0228/files/long_20sleeve_e8db1e36-36cf-48c8-8a26-ab99b33402dc.png?v=1715388229",
                "Tank Top": "https://www.dropbox.com/scl/fi/uimc3ug3np15vdzv40o5m/TANK-TOP.png?rlkey=15lh8qucsvrb2460u08lfkuez&st=bkoxhvq7&raw=1",
                Sweatshirt: "https://d3d71ba2asa5oz.cloudfront.net/12043248/images/unisex%20sweatshirt.png",
                Hoodie: "https://cdn.shopify.com/s/files/1/0067/6148/0228/products/hoodies_100_c758a436-974a-4b8f-800e-c026fc76a1a3.jpg?v=1677346373",
            },
            WO: {
                "T-shirt": "https://d3d71ba2asa5oz.cloudfront.net/12044225/images/new-tshirt-wotsa__100.jpg",
                "Crop Tee": "https://d3d71ba2asa5oz.cloudfront.net/12042359/images/au%20crop%20tee.jpg",
                "Crop Top": "https://d3d71ba2asa5oz.cloudfront.net/12042359/images/au%20crop%20tee.jpg",
                "Long Sleeve": "https://cdn.shopify.com/s/files/1/0067/6148/0228/files/long_20sleeve_e8db1e36-36cf-48c8-8a26-ab99b33402dc.png?v=1715388229",
                "Racerback Tank": "https://ptos-url.s3.us-east-1.amazonaws.com/women+racerback.png",
                Sweatshirt: "https://d3d71ba2asa5oz.cloudfront.net/12043248/images/unisex%20sweatshirt.png",
                Hoodie: "https://cdn.shopify.com/s/files/1/0067/6148/0228/products/hoodies_100_c758a436-974a-4b8f-800e-c026fc76a1a3.jpg?v=1677346373",
            },
            YO: {
                "T-shirt": "https://ptos-url.s3.us-east-1.amazonaws.com/YOUTH+tshirt.png",
                "Long Sleeve": "",
                Sweatshirt: "",
                Hoodie: "https://ptos-url.s3.us-east-1.amazonaws.com/YOUTH+HOODIE.png"
            },
            TO: {
                "T-shirt": "https://ptos-url.s3.us-east-1.amazonaws.com/1737480551577-Size%20Chart%20for%20TOTSA.jpg",
                "Long Sleeve": "https://ptos-url.s3.us-east-1.amazonaws.com/toddler+longsleeve.png",
                Sweatshirt: "",
                Hoodie: "https://ptos-url.s3.us-east-1.amazonaws.com/toddler+hoodie.png"
            },
            BB: {
                "T-shirt": "https://ptos-url.s3.us-east-1.amazonaws.com/1736849347455-BABY%20tshirt.jpeg",
                Bodysuit: "https://ptos-url.s3.us-east-1.amazonaws.com/1736488751364-bodysuite.jpeg"
            }
        };

        // Validar si la clasificación y el estilo existen en el objeto de URLs
        if (urls[classification] && urls[classification][style]) {
            return urls[classification][style];
        } else {
            return "";
        }
    }

    generateEbayTemplate(masterList: any[]) {
        const titleRow = [
            'Ebay template - (Do NOT remove the first 3 rows). You MAY delete or change the order of columns, but do NOT alter the header names in row 3. *Required Fields.',
        ];
        const secondRow = [
            'SKU*',
            'SKU of Parent Product',
            'Product Name',
            'Product Description',
            'Brand Name',
            'Condition (new, used, reconditioned)',
            'Condition Note',
            'Price',
            'Notes',
            "Manufacturer's Suggested Retail Price",
            'Sellbrite Category Name',
            'Store Product URL',
            'Manufacturer',
            'Manufacturer Model/Part Number',
            'UPC',
            'EAN',
            'ISBN',
            'GTIN',
            'GCID',
            'ASIN',
            'ePID',
            'Package Height (inches)',
            'Package Length (inches)',
            'Package Width (inches)',
            'Package Weight (pounds)',
            'Feature 1',
            'Feature 2',
            'Feature 3',
            'Variation 1',
            'Variation 2',
            'Product Image URL 1',
            'Product Image URL 2',
            'Product Image URL 3',
            'Product Image URL 4',
            "Delete (delete a product by entering 'DELETE' in its row)",
        ];
        const thirdRow = [
            'sku',
            'parent_sku',
            'name',
            'description',
            'brand',
            'condition',
            'condition_note',
            'price',
            'notes',
            'msrp',
            'category_name',
            'store_product_url',
            'manufacturer',
            'manufacturer_model_number',
            'upc',
            'ean',
            'isbn',
            'gtin',
            'gcid',
            'asin',
            'epid',
            'package_height',
            'package_length',
            'package_width',
            'package_weight',
            'feature_1',
            'feature_2',
            'feature_3',
            'variation_1',
            'variation_2',
            'product_image_1',
            'product_image_2',
            'product_image_3',
            'product_image_4',
            'delete',
        ];

        // Datos de las filas (padres e hijos)
        const data: any[][] = [];
        masterList.forEach((parent) => {
            data.push([
                parent.parent_sku, //sku
                '', //parent_sku
                parent.title, //name
                parent.description, //description
                'Smartprints', //brand
                'New without tags', //condition
                '', //condition_note
                '', //Precio
                '', //notes
                '', //MSRP
                parent.categories.Ebay, //category_name
                '', //store_product_url
                'Smartprints', //manufacturer
                '', //manufacturer_model_number
                '', //upc
                '', //ean
                '', //isbn
                '', //gtin
                '', //gcid
                '', //asin
                '', //epid
                0, //package_height
                0, //package_length
                0, //package_width
                0, //package_weight
                parent.feature1, //feature_1
                parent.feature2, //feature_2
                parent.feature3, //feature_3
                'Size', //variation_1
                'Color', //variation_2
                parent.childrens[0].image1, //product_image_1
                parent.childrens[0].image2, //product_image_2
                parent.childrens[0].image3, //product_image_3
                parent.childrens[0].image4, //product_image_4
                '', //delete
            ]);
            parent.childrens.forEach((child: any) => {
                data.push([
                    child.full_sku, //sku',
                    parent.parent_sku, //parent_sku',
                    '', //name',
                    '', //description',
                    '', //brand',
                    '', //condition',
                    '', //condition_note',
                    child.price, //price',
                    '', //notes',
                    child.msrp, //msrp',
                    '', //category_name',
                    '', //store_product_url',
                    'Smartprints', //manufacturer',
                    child.mpn, //manufacturer_model_number',
                    '', //upc',
                    '', //ean',
                    '', //isbn',
                    '', //gtin',
                    '', //gcid',
                    '', //asin',
                    '', //epid',
                    0, //package_height',
                    0, //package_length',
                    0, //package_width',
                    0, //package_weight',
                    '', //feature_1',
                    '', //feature_2',
                    '', //feature_3',
                    child.size, //variation_1',
                    child.color, //variation_2',
                    child.image1, //product_image_1',
                    child.image2, //product_image_2',
                    child.image3, //product_image_3',
                    child.image4, //product_image_4',
                    '', //delete',
                ]);
            });
        });

        // Crear hoja de trabajo
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            titleRow,
            secondRow,
            thirdRow,
            ...data,
        ]);

        // Aplicar combinación de celdas en la primera fila
        ws['!merges'] = [
            {
                s: { r: 0, c: 0 },
                e: { r: 0, c: secondRow.length - 1 },
            },
        ];

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Ebay Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Ebay_template.xlsx');
    }
    generateWalmartTemplate(masterList: any[]) {
        const headerRow1 = [
            'SKU',
            'Spec Product Type',
            'Product ID Type',
            'Product ID',
            'Product Name',
            'Brand Name',
            'Selling Price',
            'Shipping Weight (lbs)',
            'Site Description',
            'Key Features (+)',
            'Key Features 1 (+)',
            'Key Features 2 (+)',
            'Main Image URL',
            'Count Per Pack',
            'Total Count',
            'Multipack Quantity',
            'Is Prop 65 Warning Required',
            'Age Group (+)',
            'Clothing Neck Style',
            'Clothing Size',
            'Clothing Size Group (+)',
            'Clothing Style (+)',
            'Clothing Top Style (+)',
            'Color',
            'Color Category (+)',
            'Condition',
            'Fabric Care Instructions (+)',
            'Fabric Material Name',
            'Fabric Material Percentage',
            'Gender',
            'Has Written Warranty',
            'Measure',
            'Unit',
            'Sleeve Length Style',
            'Small Parts Warning Code (+)',
            'Zippered',
            'Sweatshirt & Hoodie Type',
            'Upper Body Strap Configuration',
            'Academic Institution',
            'Additional Image URL (+)',
            'Additional Image URL (+)',
            'Additional Image URL (+)',
            'Measure',
            'Unit',
            'Measure',
            'Unit',
            'Measure',
            'Unit',
            'Measure',
            'Unit',
            'Brand License (+)',
            'California Prop 65 Warning Text',
            'Character (+)',
            'Character Group (+)',
            'Closure Type (+)',
            'Clothing Back Style',
            'Clothing Feature (+)',
            'Clothing Fit',
            'Clothing Occasion (+)',
            'Clothing Shoulder Style (+)',
            'Collar Style',
            'Designer',
            'Embellishment Type (+)',
            'Fabric Construction',
            'Frame Color Configuration (+)',
            'Front End Photo Partner',
            'Law Label Identification Provider',
            'Law Label Registration Number',
            'Manufacturer Name',
            'Manufacturer Part Number',
            'Maximum Order Quantity',
            'Minimum Order Quantity',
            'Model Number',
            'Net Content Statement',
            'Number of Pieces',
            'Paper Finish Configuration (+)',
            'Pattern (+)',
            'Personal Relationship (+)',
            'Photo Accessory Item SKU (+)',
            'Photo Configuration Attribute Names (+)',
            'Photo Item Store WUPC',
            'Photo Order Quantity Tier',
            'Product Line (+)',
            'Percentage of Recycled Material',
            'Recycled Material',
            'Retail Packaging',
            'Sleeve Style',
            'Sports League (+)',
            'Sports Team (+)',
            'T-Shirt Type',
            'Theme',
            'Third Party Accreditation Symbol on Product Package Code (+)',
            'Warranty Text',
            'Warranty URL',
            'Variant Group ID',
            'Variant Attribute Names (+)',
            'Variant Attribute Names (+)',
            'Is Primary Variant',
            'Swatch Variant Attribute',
            'Swatch Image URL',
            'ZIP Codes',
            'States',
            'State Restrictions Reason',
            'Product is or Contains an Electronic Component?',
            'Product is or Contains a Chemical, Aerosol or Pesticide?',
            'Product is or Contains this Battery Type',
            'Fulfillment Lag Time',
            'Ships in Original Packaging',
            'Must ship alone?',
            'Is Preorder',
            'Release Date',
            'Site Start Date',
            'Site Start Time',
            'Site End Date',
            'Inventory',
            'Fulfillment Center ID',
            'Pre Order Available On',
            'External Product ID Type',
            'External Product ID',
            'Product Id Update',
            'SKU Update',
        ];

        const headerRow2 = [
            'sku',
            'specProductType',
            'productIdType',
            'productId',
            'productName',
            'brand',
            'price',
            'ShippingWeight',
            'shortDescription',
            'keyFeatures',
            'keyFeatures',
            'keyFeatures',
            'mainImageUrl',
            'countPerPack',
            'count',
            'multipackQuantity',
            'isProp65WarningRequired',
            'ageGroup',
            'shirtNeckStyle',
            'clothingSize',
            'clothingSizeGroup',
            'clothingStyle',
            'clothingTopStyle',
            'color',
            'colorCategory',
            'condition',
            'fabricCareInstructions',
            'materialName',
            'materialPercentage',
            'gender',
            'has_written_warranty',
            'productNetContentMeasure',
            'productNetContentUnit',
            'sleeveLengthStyle',
            'smallPartsWarnings',
            'zippered',
            'sweatshirt_and_hoodie_type',
            'upperBodyStrapConfiguration',
            'academicInstitution',
            'productSecondaryImageURL',
            'productSecondaryImageURL',
            'productSecondaryImageURL',
            'measure',
            'unit',
            'measure',
            'unit',
            'measure',
            'unit',
            'measure',
            'unit',
            'globalBrandLicense',
            'prop65WarningText',
            'character',
            'character_group',
            'fastenerType',
            'clothing_back_style',
            'clothing_feature',
            'clothingFit',
            'clothing_occasion',
            'clothing_shoulder_style',
            'collarType',
            'designer',
            'embellishmentType',
            'fabric_construction',
            'frameColorConfiguration',
            'frontEndPhotoPartner',
            'law_label_identification_provider',
            'law_label_registration_number',
            'manufacturer',
            'manufacturerPartNumber',
            'maximumOrderQuantity',
            'minimumOrderQuantity',
            'modelNumber',
            'netContentStatement',
            'pieceCount',
            'photoPaperFinishConfiguration',
            'pattern',
            'personalRelationship',
            'photoAccessoryItemSku',
            'photoConfigurationAttributeNames',
            'photoItemStoreUpc',
            'photoOrderQuantityTier',
            'productLine',
            'percentageOfRecycledMaterial',
            'recycledMaterial',
            'ib_retail_packaging',
            'sleeveStyle',
            'sportsLeague',
            'sportsTeam',
            't_shirt_type',
            'theme',
            'thirdPartyAccreditationSymbolOnProductPackageCode',
            'warrantyText',
            'warrantyURL',
            'variantGroupId',
            'variantAttributeNames',
            'variantAttributeNames',
            'isPrimaryVariant',
            'swatchVariantAttribute',
            'swatchImageUrl',
            'zipCodes',
            'states',
            'stateRestrictionsText',
            'electronicsIndicator',
            'chemicalAerosolPesticide',
            'batteryTechnologyType',
            'fulfillmentLagTime',
            'shipsInOriginalPackaging',
            'MustShipAlone',
            'IsPreorder',
            'releaseDate',
            'startDate',
            'siteStartTime',
            'endDate',
            'quantity',
            'fulfillmentCenterID',
            'inventoryAvailabilityDate',
            'externalProductIdType',
            'externalProductId',
            'ProductIdUpdate',
            'SkuUpdate',
        ];

        const data: any[][] = [];
        masterList.forEach((parent) => {
            parent.childrens.forEach((child: any, index: number) => {
                data.push([
                    child.full_sku, // sku',
                    this.walmartProductType(parent.styles), // specProductType',
                    'GTIN', // productIdType',
                    'Custom', // productId',
                    parent.title, // productName',
                    'Smartprints', // brand',
                    child.price, // price',
                    0.25, // ShippingWeight',
                    parent.description, // shortDescription',
                    parent.feature1, // keyFeatures',
                    parent.feature2, // keyFeatures',
                    parent.feature3, // keyFeatures',
                    child.image1, // mainImageUrl',
                    1, // countPerPack',
                    1, // count',
                    1, // multipackQuantity',
                    'No', // isProp65WarningRequired',
                    this.walmartAgeGroup(parent.classification), // ageGroup',
                    'Crew Neck', // shirtNeckStyle',
                    child.size, // clothingSize',
                    this.walmartClotingSizeGroup(parent.classification), // clothingSizeGroup',
                    'Casual', // clothingStyle',
                    'Pullover', // clothingTopStyle',
                    child.color, // color',
                    this.walmartColorCategory(child.color), // colorCategory',
                    'New', // condition',
                    'Machine Wash', // fabricCareInstructions',
                    'Cotton', // materialName',
                    100, // materialPercentage',
                    this.walmartGender(parent.classification), // gender',
                    'Yes - Warranty Text', // has_written_warranty',
                    1, // productNetContentMeasure',
                    'Pound', // productNetContentUnit',
                    this.walmartSleeveLengthStyle(parent.styles), // sleeveLengthStyle',
                    '0 - No warning applicable', // smallPartsWarnings',
                    'No', // zippered',
                    parent.styles == 'Sweatshirt' || parent.styles == 'Hoodie'
                        ? parent.styles
                        : '', // sweatshirt_and_hoodie_type',
                    '', // upperBodyStrapConfiguration',
                    '', // academicInstitution',
                    child.image2, // productSecondaryImageURL',
                    child.image3, // productSecondaryImageURL',
                    child.image4, // productSecondaryImageURL',
                    '', // measure',
                    '', // unit',
                    '', // measure',
                    '', // unit',
                    '', // measure',
                    '', // unit',
                    '', // measure',
                    '', // unit',
                    'Smartprints', // globalBrandLicense',
                    'None', // prop65WarningText',
                    '', // character',
                    '', // character_group',
                    '', // fastenerType',
                    '', // clothing_back_style',
                    'Adaptable', // clothing_feature',
                    'Classic Fit', // clothingFit',
                    'Casual', // clothing_occasion',
                    '', // clothing_shoulder_style',
                    '', // collarType',
                    '', // designer',
                    '', // embellishmentType',
                    '', // fabric_construction',
                    '', // frameColorConfiguration',
                    '', // frontEndPhotoPartner',
                    '', // law_label_identification_provider',
                    '', // law_label_registration_number',
                    'Smartprints', // manufacturer',
                    '', // manufacturerPartNumber',
                    '', // maximumOrderQuantity',
                    '', // minimumOrderQuantity',
                    '', // modelNumber',
                    '', // netContentStatement',
                    '', // pieceCount',
                    '', // photoPaperFinishConfiguration',
                    'Solid', // pattern',
                    '', // personalRelationship',
                    '', // photoAccessoryItemSku',
                    '', // photoConfigurationAttributeNames',
                    '', // photoItemStoreUpc',
                    '', // photoOrderQuantityTier',
                    '', // productLine',
                    '', // percentageOfRecycledMaterial',
                    '', // recycledMaterial',
                    '', // ib_retail_packaging',
                    '', // sleeveStyle',
                    '', // sportsLeague',
                    '', // sportsTeam',
                    '', // t_shirt_type',
                    parent.theme, // theme',
                    '', // thirdPartyAccreditationSymbolOnProductPackageCode',
                    'All our products have 30 days warranty. 100% Satisfaction guaranteed.', // warrantyText',
                    '', // warrantyURL',
                    parent.parent_sku, // variantGroupId',
                    'clothingSize', // variantAttributeNames',
                    'color', // variantAttributeNames',
                    index === 0 ? 'Yes' : '', // isPrimaryVariant',
                    '', // swatchVariantAttribute',
                    '', // swatchImageUrl',
                    '', // zipCodes',
                    '', // states',
                    '', // stateRestrictionsText',
                    'No', // electronicsIndicator',
                    'No', // chemicalAerosolPesticide',
                    '', // batteryTechnologyType',
                    '', // fulfillmentLagTime',
                    'Yes', // shipsInOriginalPackaging',
                    'Yes', // MustShipAlone',
                    '', // IsPreorder',
                    '', // releaseDate',
                    '', // startDate',
                    '', // siteStartTime',
                    '', // endDate',
                    200, // quantity',
                    '10000000640', // fulfillmentCenterID',
                    '', // inventoryAvailabilityDate',
                    '', // externalProductIdType',
                    '', // externalProductId',
                    '', // ProductIdUpdate',
                    '', // SkuUpdate',
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow1,
            headerRow2,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Walmart Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Walmart_template.xlsx');
    }
    generateAmazonTemplate(masterList: any[]) {
        const headerRow = [
            'Seller SKU',
            'Record Action',
            'Product Type',
            'Item Name',
            'Brand Name',
            'Is exempt from supplier declared external product identifier',
            'Item Type Keyword',
            'Amazon(CA,AU) - Categorie',
            'Model Name',
            'Offering Condition Type',
            'List Price',
            'Merchant Shipping Group',
            'Import Designation',
            'Fulfillment Channel Code (US)',
            'Quantity (US)',
            'Handling Time (US)',
            'Your Price USD (Sell on Amazon, US)',
            'Product Description',
            'Bullet Point',
            'Bullet Point',
            'Bullet Point',
            'Generic Keywords',
            'Special Features',
            'Special Features',
            'Special Features',
            'Style',
            'Department Name',
            'Target Gender',
            'Age Range Description',
            'Shirt Size System',
            'Shirt Size Class',
            'Shirt Size Value',
            'Shirt Size To Range',
            'Shirt Body Type',
            'Shirt Height Type',
            'Material',
            'Fabric Type',
            'Special Size',
            'Color',
            'Item Length Description',
            'Part Number',
            'Theme',
            'Fit Type',
            'Care Instructions',
            'Is Customizable?',
            'Pattern',
            'Neck Style',
            'Sleeve Type',
            'Parentage Level',
            'Child Relationship Type',
            'Parent SKU',
            'Variation Theme Name',
            'Country of Origin',
            'Main Image URL',
            'Other Image URL',
            'Other Image URL',
            'Other Image URL',
            'Package Weight',
            'Package Weight Unit',
        ];

        // Datos de las filas (padres e hijos)
        const data: any[][] = [];
        masterList.forEach((parent) => {
            data.push([
                parent.parent_sku, // Seller SKU
                'Full Update', // Record Action
                this.amazonProductType(parent.styles), // Product Type
                parent.title, // Item Name
                'Smartprints', // Brand Name
                'Yes', // Is exempt from supplier declared external product identifier
                this.amazonItemTypeKeyword(parent.styles), // Item Type Keyword
                parent.categories.Amazon, // Amazon(CA,AU) - Categorie
                'N/A', // Model Name
                'New', // Offering Condition Type
                parent.childrens[0].price, // List Price
                'Migrated Template', // Merchant Shipping Group
                'Made in the USA and Imported', // Import Designation
                'DEFAULT', // Fulfillment Channel Code (US)
                200, // Quantity (US)
                3, // Handling Time (US)
                parent.childrens[0].price, // Your Price USD (Sell on Amazon, US)
                parent.description, // Product Description
                parent.feature1, // Bullet Point
                parent.feature2, // Bullet Point
                parent.feature3, // Bullet Point
                parent.keywords, // Generic Keywords
                'Breathable', // Special Features
                'Absorbent', // Special Features
                'Lightweight', // Special Features
                this.amazonStyle(parent.styles), // Style
                parent.amazonDepart, // Department Name
                this.amazonTargetGender(parent.amazonDepart), // Target Gender
                this.amazonAgeRangeDesc(parent.classification), // Age Range Description
                'US', // Shirt Size System
                'Alpha', // Shirt Size Class
                '', // Shirt Size Value
                '', // Shirt Size To Range
                'Regular', // Shirt Body Type
                'Regular', // Shirt Height Type
                'Cotton', // Material
                '100% Cotton', // Fabric Type
                'Standard', // Special Size
                '', // Color
                'Short Length', // Item Length Description
                '', // Part Number
                parent.theme, // Theme
                '', // Fit Type
                'Machine Wash', // Care Instructions
                'No', // Is Customizable?
                'Solid', // Pattern
                'Crew Neck', // Neck Style
                this.amazonSleeveStyle(parent.styles), // Sleeve Type
                'Parent', // Parentage Level
                'Variation', // Child Relationship Type
                parent.parent_sku, // Parent SKU
                'SIZE/COLOR', // Variation Theme Name
                'United States', // Country of Origin
                parent.childrens[0].image1, // Main Image URL
                parent.childrens[0].image2, // Other Image URL
                parent.childrens[0].image3, // Other Image URL
                parent.childrens[0].image4, // Other Image URL
                '', // Package Weight
                '', // Package Weight Unit
            ]);
            parent.childrens.forEach((child: any) => {
                data.push([
                    child.full_sku, // Seller SKU
                    'Full Update', // Record Action
                    this.amazonProductType(parent.styles), // Product Type
                    parent.title, // Item Name
                    'Smartprints', // Brand Name
                    'Yes', // Is exempt from supplier declared external product identifier
                    this.amazonItemTypeKeyword(parent.styles), // Item Type Keyword
                    parent.categories.Amazon, // Amazon(CA,AU) - Categorie
                    'N/A', // Model Name
                    'New', // Offering Condition Type
                    child.price, // List Price
                    'Migrated Template', // Merchant Shipping Group
                    'Made in the USA and Imported', // Import Designation
                    'DEFAULT', // Fulfillment Channel Code (US)
                    200, // Quantity (US)
                    3, // Handling Time (US)
                    child.price, // Your Price USD (Sell on Amazon, US)
                    parent.description, // Product Description
                    parent.feature1, // Bullet Point
                    parent.feature2, // Bullet Point
                    parent.feature3, // Bullet Point
                    parent.keywords, // Generic Keywords
                    'Breathable', // Special Features
                    'Absorbent', // Special Features
                    'Lightweight', // Special Features
                    this.amazonStyle(parent.styles), // Style
                    parent.amazonDepart, // Department Name
                    this.amazonTargetGender(parent.amazonDepart), // Target Gender
                    this.amazonAgeRangeDesc(parent.classification), // Age Range Description
                    'US', // Shirt Size System
                    'Alpha', // Shirt Size Class
                    this.amazonTranslateSize(child.size), // Shirt Size Value
                    this.amazonTranslateSizePlus(child.size), // Shirt Size To Range
                    'Regular', // Shirt Body Type
                    'Regular', // Shirt Height Type
                    'Cotton', // Material
                    '100% Cotton', // Fabric Type
                    'Standard', // Special Size
                    child.color, // Color
                    'Short Length', // Item Length Description
                    child.mpn, // Part Number
                    parent.theme, // Theme
                    'Regular Fit', // Fit Type
                    'Machine Wash', // Care Instructions
                    'No', // Is Customizable?
                    'Solid', // Pattern
                    'Crew Neck', // Neck Style
                    this.amazonSleeveStyle(parent.styles), // Sleeve Type
                    'Child', // Parentage Level
                    'Variation', // Child Relationship Type
                    parent.parent_sku, // Parent SKU
                    'SIZE/COLOR', // Variation Theme Name
                    'United States', // Country of Origin
                    child.image1, // Main Image URL
                    child.image2, // Other Image URL
                    child.image3, // Other Image URL
                    child.image4, // Other Image URL
                    5.3, // Package Weight
                    'Ounces', // Package Weight Unit
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Amazon Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Amazon_template.xlsx');
    }
    generatePipelineTemplate(masterList: any[]) {
        const headerRow1 = [
            'ID',
            'Type',
            'SKU',
            'Name',
            'Published',
            'Is featured?',
            'Visibility in catalog',
            'Short description',
            'Description',
            'Date sale price starts',
            'Date sale price ends',
            'Tax status',
            'Tax class',
            'In stock?',
            'Stock',
            'Low stock amount',
            'Backorders allowed?',
            'Sold individually?',
            'Weight (kg)',
            'Length (cm)',
            'Width (cm)',
            'Height (cm)',
            'Allow customer reviews?',
            'Purchase note',
            'Sale price',
            'Regular price',
            'Categories',
            'Tags',
            'Shipping class',
            'Images',
            'Download limit',
            'Download expiry days',
            'Parent',
            'Grouped products',
            'Upsells',
            'Cross-sells',
            'External URL',
            'Button text',
            'Position',
            'Woo Variation Gallery Images',
            'Attribute 1 name',
            'Attribute 1 value(s)',
            'Attribute 1 visible',
            'Attribute 1 global',
            'Attribute 1 default',
            'Attribute 2 name',
            'Attribute 2 value(s)',
            'Attribute 2 visible',
            'Attribute 2 global',
            'Attribute 2 default',
        ];

        const data: any[][] = [];
        masterList.forEach((parent) => {
            data.push([
                '', //ID
                'variable', //Type
                parent.parent_sku, //SKU
                parent.title, //Name
                1, //Published
                0, //Is featured?
                'visible', //Visibility in catalog
                parent.description, //Short description
                parent.description, //Description
                '', //Date sale price starts
                '', //Date sale price ends
                'taxable', //Tax status
                '', //Tax class
                10, //In stock?
                '', //Stock
                '', //Low stock amount
                '', //Backorders allowed?
                '', //Sold individually?
                '', //Weight (kg)
                '', //Length (cm)
                '', //Width (cm)
                '', //Height (cm)
                1, //Allow customer reviews?
                '', //Purchase note
                '', //Sale price
                '', //Regular price
                parent.categories.Pipeline, //Categories
                '', //Tags
                '', //Shipping class
                `${parent.childrens[parent.childrens.length - 1].image1},${parent.childrens[parent.childrens.length - 1].image2
                },${parent.childrens[parent.childrens.length - 1].image3}`, //Images
                '', //Download limit
                '', //Download expiry days
                '', //Parent
                '', //Grouped products
                '', //Upsells
                '', //Cross-sells
                '', //External URL
                '', //Button text
                0, //Position
                '', //Woo Variation Gallery Images
                'Size', //Attribute 1 name
                this.pipelineGetUniqueSizes(parent.childrens), //Attribute 1 value(s)
                1, //Attribute 1 visible
                1, //Attribute 1 global
                parent.childrens[parent.childrens.length - 1].size, //Attribute 1 default
                'Color', //Attribute 2 name
                this.pipelineGetUniqueColors(parent.childrens), //Attribute 2 value(s)
                1, //Attribute 2 visible
                1, //Attribute 2 global
                parent.childrens[parent.childrens.length - 1].color, //Attribute 2 default
            ]);
            parent.childrens.forEach((child: any, index: number) => {
                data.push([
                    '', //ID
                    'variation', //Type
                    child.full_sku, //SKU
                    '', //Name
                    1, //Published
                    0, //Is featured?
                    'visible', //Visibility in catalog
                    '', //Short description
                    '', //Description
                    '', //Date sale price starts
                    '', //Date sale price ends
                    'taxable', //Tax status
                    'parent', //Tax class
                    10, //In stock?
                    '', //Stock
                    '', //Low stock amount
                    '', //Backorders allowed?
                    '', //Sold individually?
                    '', //Weight (kg)
                    '', //Length (cm)
                    '', //Width (cm)
                    '', //Height (cm)
                    '', //Allow customer reviews?
                    '', //Purchase note
                    '', //Sale price
                    child.price, //Regular price
                    '', //Categories
                    '', //Tags
                    '', //Shipping class
                    child.image1, //Images
                    '', //Download limit
                    '', //Download expiry days
                    parent.parent_sku, //Parent
                    '', //Grouped products
                    '', //Upsells
                    '', //Cross-sells
                    '', //External URL
                    '', //Button text
                    '', //Position
                    `${child.image1},${child.image2},${child.image3}`, //Woo Variation Gallery Images
                    'Size', //Attribute 1 name
                    child.size, //Attribute 1 value(s)
                    '', //Attribute 1 visible
                    1, //Attribute 1 global
                    '', //Attribute 1 default
                    'Color', //Attribute 2 name
                    child.color, //Attribute 2 value(s)
                    '', //Attribute 2 visible
                    1, //Attribute 2 global
                    '', //Attribute 2 default
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow1,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Pipeline Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Pipeline_template.xlsx');
    }
    generateFaireTemplate(masterList: any[]) {
        const headerRow1 = [
            "Product Name (English)",
            "Product Status",
            "Product Token",
            "Product Type",
            "Description (English)",
            "Selling Method",
            "Case Size",
            "Minimum Order Quantity",
            "Item Weight",
            "Item Weight Unit",
            "Item Length",
            "Item Width",
            "Item Height",
            "Item Dimensions Unit",
            "Packaged Weight",
            "Packaged Weight Unit",
            "Packaged Length",
            "Packaged Width",
            "Packaged Height",
            "Packaged Dimensions Unit",
            "Option Status",
            "SKU",
            "GTIN",
            "Option 1 Name",
            "Option 1 Value",
            "Option 2 Name",
            "Option 2 Value",
            "Option 3 Name",
            "Option 3 Value",
            "USD Unit Wholesale Price",
            "USD Unit Retail Price",
            "CAD Unit Wholesale Price",
            "CAD Unit Retail Price",
            "GBR Unit Wholesale Price",
            "GBR Unit Retail Price",
            "EUR Unit Wholesale Price",
            "EUR Unit Retail Price",
            "AUD Unit Wholesale Price",
            "AUD Unit Retail Price",
            "Option Image",
            "Preorder",
            "Ship By Date (YYYY-MM-DD)",
            "Ship By End Date (if range, YYYY-MM-DD)",
            "Deadline To Order (YYYY-MM-DD)",
            "Sell After Order By/Ship Date",
            "Product Images",
            "Made In Country",
            "Tester Price (USD)",
            "Tester Price (CAD)",
            "Tester Price (GBP)",
            "Tester Price (EUR)",
            "Tester Price (AUD)",
            "Customizable",
            "Customization Instructions",
            "Customization Input Required",
            "Customization Input Character Limit",
            "Customization Minimum Order Quantity",
            "Customization Charge Per Unit (USD)",
            "Customization Charge Per Unit (CAD)",
            "Customization Charge Per Unit (GBP)",
            "Customization Charge Per Unit (EUR)",
            "Customization Charge Per Unit (AUD)",
            "Continue selling when out of stock",
            "On Hand Inventory",
            "Restock Date",
            "HS6 Tariff Code"
        ];

        const data: any[][] = [];
        masterList.forEach((parent) => {
            parent.childrens.forEach((child: any, index: number) => {
                data.push([
                    parent.title, //Product Name (English)
                    'Published', //Product Status
                    '', //Product Token
                    this.faireProductType(parent.styles, parent.classification), //Product Type
                    parent.description, //Description (English)
                    'By the item', //Selling Method
                    1, //Case Size
                    2, //Minimum Order Quantity
                    this.faireItemWaight(parent.styles), //Item Weight
                    'oz', //Item Weight Unit
                    '', //Item Length
                    '', //Item Width
                    '', //Item Height
                    '', //Item Dimensions Unit
                    this.faireItemWaight(parent.styles) + 1, //Packaged Weight
                    'oz', //Packaged Weight Unit
                    '', //Packaged Length
                    '', //Packaged Width
                    '', //Packaged Height
                    '', //Packaged Dimensions Unit
                    'Published', //Option Status
                    child.full_sku, //SKU
                    '', //GTIN
                    'Color', //Option 1 Name
                    child.color, //Option 1 Value
                    'Material', //Option 2 Name
                    this.faireMaterial(parent.styles), //Option 2 Value
                    'Size', //Option 3 Name
                    child.size, //Option 3 Value
                    child.price, //USD Unit Wholesale Price
                    this.faireWholesalePrice(parent.styles), //USD Unit Retail Price
                    '', //CAD Unit Wholesale Price
                    '', //CAD Unit Retail Price
                    '', //GBR Unit Wholesale Price
                    '', //GBR Unit Retail Price
                    '', //EUR Unit Wholesale Price
                    '', //EUR Unit Retail Price
                    '', //AUD Unit Wholesale Price
                    '', //AUD Unit Retail Price
                    child.image1, //Option Image
                    'No', //Preorder
                    '', //Ship By Date (YYYY-MM-DD)
                    '', //Ship By End Date (if range, YYYY-MM-DD)
                    '', //Deadline To Order (YYYY-MM-DD)
                    '', //Sell After Order By/Ship Date
                    `${child.image1}
                    ${child.image2}
                    ${child.image3}
                    `, //Product Images
                    'United States', //Made In Country
                    '', //Tester Price (USD)
                    '', //Tester Price (CAD)
                    '', //Tester Price (GBP)
                    '', //Tester Price (EUR)
                    '', //Tester Price (AUD)
                    'No', //Customizable
                    '', //Customization Instructions
                    '', //Customization Input Required
                    '', //Customization Input Character Limit
                    '', //Customization Minimum Order Quantity
                    '', //Customization Charge Per Unit (USD)
                    '', //Customization Charge Per Unit (CAD)
                    '', //Customization Charge Per Unit (GBP)
                    '', //Customization Charge Per Unit (EUR)
                    '', //Customization Charge Per Unit (AUD)
                    'Yes', //Continue selling when out of stock
                    200, //On Hand Inventory
                    '', //Restock Date
                    ''  //HS6 Tariff Code
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow1,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Faire Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Faire_template.xlsx');
    }
    generateShopifyTemplate(masterList: any[]) {
        const headerRow1 = [
            "Handle",
            "Title",
            "Body (HTML)",
            "Vendor",
            "Product Category",
            "Type",
            "Tags",
            "Collections",
            "Option1 Name",
            "Option1 Value",
            "Option1 Linked To",
            "Option2 Name",
            "Option2 Value",
            "Option2 Linked To",
            "Option3 Name",
            "Option3 Value",
            "Option3 Linked To",
            "Variant SKU",
            "Variant Grams",
            "Variant Inventory Tracker",
            "Variant Inventory Policy",
            "Variant Fulfillment Service",
            "Variant Price",
            "Variant Compare At Price",
            "Variant Requires Shipping",
            "Variant Taxable",
            "Variant Barcode",
            "Image Src",
            "",
            "Variant Image",
            "Image Alt Text",
            "Gift Card",
            "SEO Title",
            "SEO Description",
            "Google Shopping / Google Product Category",
            "Google Shopping / Gender",
            "Google Shopping / Age Group",
            "Google Shopping / MPN",
            "Google Shopping / Condition",
            "Google Shopping / Custom Product",
            "Google Shopping / Custom Label 0",
            "Google Shopping / Custom Label 1",
            "Google Shopping / Custom Label 2",
            "Google Shopping / Custom Label 3",
            "Google Shopping / Custom Label 4",
            "Google: Custom Product (product.metafields.mm-google-shopping.custom_product)",
            "Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)",
            "Related products (product.metafields.shopify--discovery--product_recommendation.related_products)",
            "Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)",
            "Variant Weight Unit",
            "Variant Tax Code",
            "Cost per item",
            "Included / United States",
            "Price / United States",
            "Compare At Price / United States",
            "Included / International",
            "Price / International",
            "Compare At Price / International",
            "San Jose",
            "Status"
        ];

        const data: any[][] = [];
        masterList.forEach((parent) => {
            parent.childrens.forEach((child: any, index: number) => {
                data.push([
                    this.shopifyHandler(parent.title), //Handle
                    (index == 0) ? parent.title : '', //Title
                    (index == 0) ? parent.description : '', //Body (HTML)
                    (index == 0) ? 'Smartprints' : '', //Vendor
                    (index == 0) ? parent.categories.Shopify : '', //Product Category
                    (index == 0) ? this.shopifyProductType(parent.styles) : '', //Type
                    (index == 0) ? parent.keywords : '', //Tags
                    '', //Collections
                    (index == 0) ? 'Size' : '', //Option1 Name
                    child.size, //Option1 Value
                    '', //Option1 Linked To
                    (index == 0) ? 'Color' : '', //Option2 Name
                    child.color, //Option2 Value
                    '', //Option2 Linked To
                    '', //Option3 Name
                    '', //Option3 Value
                    '', //Option3 Linked To
                    child.full_sku, //Variant SKU
                    '', //Variant Grams
                    'shopify', //Variant Inventory Tracker
                    'deny', //Variant Inventory Policy
                    'manual', //Variant Fulfillment Service
                    child.price, //Variant Price
                    '', //Variant Compare At Price
                    'TRUE', //Variant Requires Shipping
                    'TRUE', //Variant Taxable
                    '', //Variant Barcode
                    (index < 5) ? this.shopifyImageSrc(child, index) : '', //Image Src
                    (index < 4) ? index + 1 : '',
                    child.image1,//Variant Image
                    '', //Image Alt Text
                    'FALSE', //Gift Card
                    (index == 0) ? parent.title : '', //SEO Title
                    (index == 0) ? parent.description : '', //SEO Description
                    (index == 0) ? parent.categories.Shopify : '', //Google Shopping / Google Product Category
                    (index == 0) ? this.shopifyGender(parent.classification) : '', //Google Shopping / Gender
                    (index == 0) ? this.shopifyAgeGroup(parent.classification) : '', //Google Shopping / Age Group
                    '', //Google Shopping / MPN
                    'New', //Google Shopping / Condition
                    'FALSE', //Google Shopping / Custom Product
                    '', //Google Shopping / Custom Label 0
                    '', //Google Shopping / Custom Label 1
                    '', //Google Shopping / Custom Label 2
                    '', //Google Shopping / Custom Label 3
                    '', //Google Shopping / Custom Label 4
                    'FALSE', //Google: Custom Product (product.metafields.mm-google-shopping.custom_product)
                    '', //Complementary products (product.metafields.shopify--discovery--product_recommendation.complementary_products)
                    '', //Related products (product.metafields.shopify--discovery--product_recommendation.related_products)
                    '', //Related products settings (product.metafields.shopify--discovery--product_recommendation.related_products_display)
                    'lb', //Variant Weight Unit
                    '', //Variant Tax Code
                    '', //Cost per item
                    'TRUE', //Included / United States
                    '', //Price / United States
                    '', //Compare At Price / United States
                    'TRUE', //Included / International
                    '', //Price / International
                    '', //Compare At Price / International
                    200, //San Jose
                    'ACTIVE'  //Status
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow1,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Shopify Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Shopify_template.xlsx');
    }

    //--------------------------Funciones especificas de Walmart -----------------------------------

    walmartProductType(type: string): string {
        const productTypeMap = new Map<string, string>([
            ['T-shirt', 'T-shirts'],
            ['T-shirt Color', 'T-shirts'],
            ['Tie Dye Crystal', 'T-shirts'],
            ['Tie Dye Cyclone', 'T-shirts'],
            ['Tie Dye Spiral', 'T-shirts'],
            ['Long Sleeve', 'T-shirts'],
            ['Hoddie', 'Sweatshirts & Hoodies'],
            ['Sweatshirt', 'Sweatshirts & Hoodies'],
            ['Crop Tee', 'Blouses & Tops'],
            ['Crop Top', 'Blouses & Tops'],
            ['Tank Top', 'Tank Tops'],
            ['Racerback Tank', 'Tank Tops'],
        ]);

        return productTypeMap.get(type) || '';
    }
    walmartAgeGroup(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Adult';
            case 'WO':
                return 'Adult';
            case 'BB':
                return 'Baby';
            case 'TO':
                return 'Toddler';
            case 'YO':
                return 'Teen';

            default:
                return '';
        }
    }
    walmartClotingSizeGroup(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Men';
            case 'WO':
                return 'Women';
            case 'BB':
                return 'Infant';
            case 'TO':
                return 'Toddler';
            case 'YO':
                return `Young Men's`;

            default:
                return '';
        }
    }
    walmartColorCategory(color: string) {
        const colorGroup = {
            Beige: [],
            Black: [
                'Black',
                'Sport Grey/black',
                'Indigo Black Heather',
                'Black/polka Dots',
                'Black Heather',
                'Solid Black',
                'Vintage Black',
                'Solid Black Blend',
            ],
            Blue: [
                'Heather Blue',
                'Light Blue Heather',
                'Pool Blue',
                'Carolina Blue',
                'Tahiti Blue',
                'Royal blue',
                'Baby Blue',
                'Blue',
                'Blue Dusk',
                'Heather Columbia Blue',
                'Solid Cool Blue',
                'Solid Light Blue',
                'Heather Ice Blue',
                'Indigo Blue',
                'Navy Blue',
                'Navy',
                'Blue Jean',
                'Blue Spruce',
                'Flo Blue',
                'Ice Blue',
                'Lagoon Blue',
                'Mystic Blue',
            ],
            Bronze: [],
            Brown: ['Brown', 'Pebble Brown'],
            Clear: [],
            Gold: [
                'Vegas Gold',
                'Solid Gold',
                'Heather Yellow Gold',
                'Gold',
                'Old Gold',
            ],
            Gray: [
                'Grey',
                'Heather Cool Grey',
                'Grey Triblend',
                'Sport Grey',
                'Warm Grey',
                'Ice Grey',
                'Ash Grey',
                'Heather Grey',
                'Sport Grey/black',
                'Dark Grey',
                'Solid Warm Grey',
                'Solid Dark Grey',
                'Solid Light Grey',
                'Dark Grey Heather',
                'Charcoal Grey',
                'Grey',
                'Oxford Grey',
            ],
            Green: [
                'Military Green',
                'Kelly Green Heather',
                'Electric Green',
                'Antique Irish Green',
                'Solid Military Green',
                'Kelly green',
                'Forest Green',
                'Green',
                'Irish Green',
                'Turf Green',
                'Solid Forest Green',
                'Solid Kelly Green',
                'Heather Green',
                'Kelly Green',
                'Light Green',
                'Safety Green',
            ],
            Multicolor: [],
            Orange: [
                'Light Orange',
                'Tennessee Orange',
                'Texas Orange',
                'Orange',
                'Antique Orange',
                'Burnt Orange',
            ],
            Pink: [
                'Hot Pink',
                'Classic Pink',
                'Safety Pink',
                'Bright Pink',
                'Vintage Hot Pink',
                'Cardinal Red',
                'Heather Red',
                'True Red',
                'Solid Red',
                'Canvas Red',
                'Solid Cardinal Red',
            ],
            Purple: [
                'Purple Rush',
                'Purple',
                'Heather Team Purple',
                'Solid Purple Rush',
                'Team Purple',
            ],
            Red: [
                'Cherry Red',
                'Red Heather',
                'Vintage Red',
                'Cherry Red',
                'Red',
            ],
            Silver: ['Silver', 'New Silver'],
            White: [
                'Vintage White',
                'White/color Dots',
                'White',
                'Solid White',
                'WHITE MARLE',
                'White/black',
                'Grey/white',
                'Black To White',
            ],
            Yellow: ['Yellow', 'Pale Yellow', 'Neon Yellow', 'Maize Yellow'],
        };

        for (const [group, colors] of Object.entries(colorGroup)) {
            if (colors.includes(color)) {
                return group;
            }
        }

        return '';
    }
    walmartGender(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Male';
            case 'WO':
                return 'Female';
            case 'BB':
                return 'Male';
            case 'TO':
                return 'Male';
            case 'YO':
                return 'Male';

            default:
                return '';
        }
    }
    walmartSleeveLengthStyle(style: string): string {
        const sleeveLengthMap = new Map<string, string>([
            ['T-shirt', 'Short Sleeve'],
            ['T-shirt Color', 'Short Sleeve'],
            ['Tie Dye Crystal', 'Short Sleeve'],
            ['Tie Dye Cyclone', 'Short Sleeve'],
            ['Tie Dye Spiral', 'Short Sleeve'],
            ['Long Sleeve', 'Long Sleeve'],
            ['Hoddie', 'Long Sleeve'],
            ['Sweatshirt', 'Long Sleeve'],
            ['Crop Tee', 'Short Sleeve'],
            ['Crop Top', 'Short Sleeve'],
            ['Tank Top', 'Sleeveless'],
            ['Racerback Tank', 'Sleeveless'],
            ['Bodysuit', 'Short Sleeve'],
        ]);

        return sleeveLengthMap.get(style) || '';
    }

    //--------------------------Funciones especificas de Amazon -----------------------------------

    amazonProductType(type: string) {
        const productTypeMap = new Map<string, string>([
            ['T-shirt', 'SHIRT'],
            ['T-shirt Color', 'SHIRT'],
            ['Tie Dye Crystal', 'SHIRT'],
            ['Tie Dye Cyclone', 'SHIRT'],
            ['Tie Dye Spiral', 'SHIRT'],
            ['Long Sleeve', 'SHIRT'],
            ['Hoddie', 'SWEATSHIRT'],
            ['Sweatshirt', 'SWEATSHIRT'],
            ['Crop Tee', 'SHIRT'],
            ['Crop Top', 'SHIRT'],
            ['Tank Top', 'SHIRT'],
            ['Racerback Tank', 'SHIRT'],
        ]);

        return productTypeMap.get(type) || '';
    }
    amazonItemTypeKeyword(type: string) {
        const productTypeMap = new Map<string, string>([
            ['T-shirt', 'fashion-t-shirts'],
            ['T-shirt Color', 'fashion-t-shirts'],
            ['Tie Dye Crystal', 'fashion-t-shirts'],
            ['Tie Dye Cyclone', 'fashion-t-shirts'],
            ['Tie Dye Spiral', 'fashion-t-shirts'],
            ['Long Sleeve', 'fashion-t-shirts'],
            ['Hoddie', 'fashion-hoodies'],
            ['Sweatshirt', 'fashion-sweatshirt'],
            ['Crop Tee', 'fashion-t-shirts'],
            ['Crop Top', 'fashion-t-shirts'],
            ['Tank Top', 'fashion-t-shirts'],
            ['Racerback Tank', 'fashion-t-shirts'],
        ]);

        return productTypeMap.get(type) || '';
    }
    amazonStyle(type: string) {
        const productStyleMap = new Map<string, string>([
            ['T-shirt', 'Graphic T-shirt'],
            ['T-shirt Color', 'Graphic T-shirt'],
            ['Tie Dye Crystal', 'Graphic T-shirt'],
            ['Tie Dye Cyclone', 'Graphic T-shirt'],
            ['Tie Dye Spiral', 'Graphic T-shirt'],
            ['Long Sleeve', 'Graphic Long Sleeve'],
            ['Hoddie', 'Graphic Hoddie'],
            ['Sweatshirt', 'Graphic Sweatshirt'],
            ['Crop Tee', 'Graphic Crop Tee'],
            ['Crop Top', 'Graphic Crop Top'],
            ['Tank Top', 'Graphic Tank Top'],
            ['Racerback Tank', 'Graphic Racerback Tank'],
        ]);

        return productStyleMap.get(type) || '';
    }
    amazonAgeRangeDesc(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Adult';
            case 'WO':
                return 'Adult';
            case 'BB':
                return 'Infant';
            case 'TO':
                return 'Toddler';
            case 'YO':
                return 'Big Kid';

            default:
                return '';
        }
    }
    amazonTargetGender(department: string) {
        switch (department) {
            case 'Mens':
                return 'Male';
            case 'Womens':
                return 'Female';
            case 'Girls':
                return 'Female';
            case 'Boys':
                return 'Male';
            case 'Toddlers':
                return 'Male';
            case 'Infants':
                return 'Male';

            default:
                return '';
        }
    }
    amazonTranslateSize(size) {
        switch (size) {
            case 'XS':
                return 'X-Small';
            case 'S':
                return 'Small';
            case 'M':
                return 'Medium';
            case 'L':
                return 'Large';
            case 'XL':
                return 'X-Large';
            case '2XL':
                return 'XX-Large';
            case '3XL':
                return '3X-Large';
            case '4XL':
                return '4X-Large';
            case '5XL':
                return '5X-Large';
            case '2T':
                return '2 Years';
            case '3T':
                return '3 Years';
            case '4T':
                return '4 Years';
            case '5T':
                return '5 Years';
            case 'NB':
                return '0 Months';
            case '6M':
                return '6 Months';
            case '12M':
                return '12 Months';
            case '18M':
                return '18 Months';
            case '24M':
                return '24 Months';

            default:
                return '';
        }
    }
    amazonTranslateSizePlus(size) {
        switch (size) {
            case 'XS':
                return 'Small';
            case 'S':
                return 'Medium';
            case 'M':
                return 'Large';
            case 'L':
                return 'X-Large';
            case 'XL':
                return 'XX-Large';
            case '2XL':
                return '3X-Large';
            case '3XL':
                return '4X-Large';
            case '4XL':
                return '5X-Large';
            case '5XL':
                return '6X-Large';
            case '2T':
                return '3 Years';
            case '3T':
                return '4 Years';
            case '4T':
                return '5 Years';
            case '5T':
                return '6 Years';
            case 'NB':
                return '6 Months';
            case '6M':
                return '12 Months';
            case '12M':
                return '18 Months';
            case '18M':
                return '24 Months';
            case '24M':
                return '24 Months';

            default:
                return '';
        }
    }
    amazonSleeveStyle(style: string) {
        const productStyleMap = new Map<string, string>([
            ['T-shirt', 'Short Sleeve'],
            ['T-shirt Color', 'Short Sleeve'],
            ['Tie Dye Crystal', 'Short Sleeve'],
            ['Tie Dye Cyclone', 'Short Sleeve'],
            ['Tie Dye Spiral', 'Short Sleeve'],
            ['Long Sleeve', 'Long Sleeve'],
            ['Hoddie', 'Long Sleeve'],
            ['Sweatshirt', 'Long Sleeve'],
            ['Crop Tee', 'Short Sleeve'],
            ['Crop Top', 'Short Sleeve'],
            ['Tank Top', 'Sleeveless'],
            ['Racerback Tank', 'Sleeveless'],
            ['Bodysuit', 'Short Sleeve'],
        ]);

        return productStyleMap.get(style) || '';
    }

    //--------------------------Funciones especificas de Pipeline -----------------------------------

    pipelineGetUniqueSizes(childrens) {
        const sizes = new Set();

        childrens.forEach((item) => {
            sizes.add(item.size);
        });

        return Array.from(sizes).join(', ');
    }
    pipelineGetUniqueColors(childrens) {
        const colors = new Set();

        childrens.forEach((item) => {
            colors.add(item.color);
        });

        return Array.from(colors).join(', ');
    }

    //--------------------------Funciones especificas de Faire -----------------------------------

    faireProductType(style: string, classification: string) {
        if (style == 'T-shirt' || style == 'Long Sleeve' || style == 'Crop Tee' || style == 'Crop Top') {
            switch (classification) {
                case 'ME':
                    return `T-Shirt - Men's`;
                case 'WO':
                    return `T-Shirt - Women's`;
                case 'YO':
                    return `T-Shirt - Unisex`;
                case 'TO':
                    return 'T-Shirt - Kids';
                case 'BB':
                    return 'T-Shirt - Baby';

                default:
                    return '';
            }
        }
        if (style == 'Hoddie') {
            switch (classification) {
                case 'ME':
                    return `Hoodie - Men's`;
                case 'WO':
                    return `Hoodie - Women's`;
                case 'YO':
                    return `Hoodie - Unisex`;
                case 'TO':
                    return 'Hoodie - Kids';
                case 'BB':
                    return 'Hoodie - Baby';

                default:
                    return '';
            }
        }
        if (style == 'Sweatshirt') {
            switch (classification) {
                case 'ME':
                    return `Sweatshirt - Men's`;
                case 'WO':
                    return `Sweatshirt - Women's`;
                case 'YO':
                    return `Sweatshirt - Unisex`;
                case 'TO':
                    return 'Sweatshirt - Kids';
                case 'BB':
                    return 'Sweatshirt - Baby';

                default:
                    return '';
            }
        }
        if (style == 'Tank Top' || style == 'Racerback Tank') {
            switch (classification) {
                case 'ME':
                    return `Tank Top - Men's`;
                case 'WO':
                    return `Tank Top - Women's`;
                case 'YO':
                    return 'Tank Top - Kids';
                case 'TO':
                    return 'Tank Top - Kids';
                case 'BB':
                    return 'Tank Top - Baby';

                default:
                    return '';
            }
        }
        if (style == 'Bodysuit') {
            switch (classification) {
                case 'BB':
                    return 'Bodysuit Set - Baby';

                default:
                    return '';
            }
        }

        return '';
    }
    faireItemWaight(style: string) {
        switch (style) {
            case 'T-shirt':
                return 5.30;
            case 'Long Sleeve':
                return 5.30;
            case 'Hoddie':
                return 20.50;
            case 'Sweatshirt':
                return 10.50;
            case 'Crop Tee':
                return 5.30;
            case 'Crop Top':
                return 5.30;
            case 'Tank Top':
                return 5.30;
            case 'Racerback Tank':
                return 5.30;
            case 'Bodysuit':
                return 4.50;

            default:
                return 0.00;
        }
    }
    faireMaterial(style: string) {
        const productStyleMap = new Map<string, string>([
            ['T-shirt', '50% US Cotton / 50% Polyester'],
            ['T-shirt Color', '50% US Cotton / 50% Polyester'],
            ['Tie Dye Crystal', '50% US Cotton / 50% Polyester'],
            ['Tie Dye Cyclone', '50% US Cotton / 50% Polyester'],
            ['Tie Dye Spiral', '50% US Cotton / 50% Polyester'],
            ['Long Sleeve', '100% US Cotton'],
            ['Hoddie', '50% US Cotton / 50% Polyester'],
            ['Sweatshirt', '75% US Cotton / 25% Recycled Polyester'],
            ['Crop Tee', '100% US Cotton'],
            ['Crop Top', '100% US Cotton'],
            ['Tank Top', '50% US Cotton / 50% Polyester'],
            ['Racerback Tank', '60% Combed Ring-Spun Cotton, 40% Polyester'],
            ['Bodysuit', '100% combed ring-spun cotton'],
        ]);

        return productStyleMap.get(style) || '';
    }
    faireWholesalePrice(style: string) {
        const productPriceMap = new Map<string, number>([
            ['T-shirt', 25.00],
            ['T-shirt Color', 25.00],
            ['Tie Dye Crystal', 25.00],
            ['Tie Dye Cyclone', 25.00],
            ['Tie Dye Spiral', 25.00],
            ['Long Sleeve', 27.00],
            ['Hoddie', 40.00],
            ['Sweatshirt', 30.00],
            ['Crop Tee', 25.00],
            ['Crop Top', 25.00],
            ['Tank Top', 20.00],
            ['Racerback', 20.00],
            ['Bodysuit', 15.00],
        ]);

        return productPriceMap.get(style) || '';
    }

    //--------------------------Funciones especificas de Shopify -----------------------------------

    shopifyHandler(title: string) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
    }
    shopifyProductType(style: string) {
        const productStyleMap = new Map<string, string>([
            ['T-shirt', 'T-shirt'],
            ['T-shirt Color', 'T-shirt'],
            ['Tie Dye Crystal', 'T-shirt'],
            ['Tie Dye Cyclone', 'T-shirt'],
            ['Tie Dye Spiral', 'T-shirt'],
            ['Long Sleeve', 'T-shirt'],
            ['Hoddie', 'Sweatshirts & Hoodies'],
            ['Sweatshirt', 'Sweatshirts & Hoodies'],
            ['Crop Tee', 'T-shirt'],
            ['Crop Top', 'T-shirt'],
            ['Tank Top', 'T-shirt'],
            ['Racerback', 'T-shirt']
        ]);

        return productStyleMap.get(style) || '';
    }
    shopifyImageSrc(child: any, index: number) {
        switch (index) {
            case 0:
                return child.image1;
            case 1:
                return child.image2;
            case 2:
                return child.image3;
            case 3:
                return child.image4;

            default:
                return '';
        }
    }
    shopifyAgeGroup(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Adult';
            case 'WO':
                return 'Adult';
            case 'BB':
                return 'Baby';
            case 'TO':
                return 'Toddler';
            case 'YO':
                return 'Teen';

            default:
                return '';
        }
    }
    shopifyGender(classification: string) {
        switch (classification) {
            case 'ME':
                return 'Male';
            case 'WO':
                return 'Female';
            case 'BB':
                return 'Male';
            case 'TO':
                return 'Male';
            case 'YO':
                return 'Male';

            default:
                return '';
        }
    }
}

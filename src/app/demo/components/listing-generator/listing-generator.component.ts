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
    ) {}

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
        } else {
            // No es un marketplace
            switch (field.toLowerCase()) {
                case 'keywords':
                    this.linkKeywords = !this.linkKeywords;
                    break;
                case 'description':
                    this.linkDescription = !this.linkDescription;
                    break;
                case 'feature1':
                    this.linkFeature1 = !this.linkFeature1;
                    break;
                case 'feature2':
                    this.linkFeature2 = !this.linkFeature2;
                    break;
                case 'feature3':
                    this.linkFeature3 = !this.linkFeature3;
                    break;

                default:
                    break;
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
            if (!design.amazonDepart) emptyFields.push('amazon department');
            if (!design.feature1) emptyFields.push('feature 1');
            if (!design.feature2) emptyFields.push('feature 2');
            if (!design.feature3) emptyFields.push('feature 3');

            // Validar categorías
            Object.entries(design.categories).forEach(
                ([market, categories]) => {
                    if (
                        this.selectedMarketplace.includes(market) &&
                        categories.length === 0
                    ) {
                        emptyFields.push(`categories.${market}`);
                    }
                }
            );

            // Si hay campos vacíos, agregar al reporte
            if (emptyFields.length > 0) {
                this.issues.push(
                    `Design "${
                        design.design
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

            if (this.selectedMarketplace.includes('Ebay')) {
                this.generateEbayTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Walmart')) {
                this.generateWalmartTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Amazon')) {
                this.generateAmazonTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Pipeline')) {
                this.generatePipelineTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Etsy')) {
                this.generateEtsyTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Shopify')) {
                this.generateShopifyTemplate(masterList);
            }
            if (this.selectedMarketplace.includes('Faire')) {
                this.generateFaireTemplate(masterList);
            }

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
                                image4: size.urls[3] ? size.urls[3] : '',
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
                                image4: size.urls[3] ? size.urls[3] : '',
                            })),
                        };
                    }
                }
            }
        }

        // Convertir `masterList` en un array
        return Object.values(masterList);
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
            // Fila para el padre
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

            // Filas para los hijos
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

        // Crear libro de trabajo
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ebay Template');

        // Guardar el archivo
        const excelBuffer: any = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });
        const dataBlob: Blob = new Blob([excelBuffer], {
            type: 'application/octet-stream',
        });
        saveAs(dataBlob, 'Ebay_template.xlsx');
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

        // Crear libro de trabajo
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Walmart Template');

        // Guardar el archivo
        const excelBuffer: any = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });
        const dataBlob: Blob = new Blob([excelBuffer], {
            type: 'application/octet-stream',
        });
        saveAs(dataBlob, 'Walmart_template.xlsx');
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

        // Crear libro de trabajo
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Amazon Template');

        // Guardar el archivo
        const excelBuffer: any = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });
        const dataBlob: Blob = new Blob([excelBuffer], {
            type: 'application/octet-stream',
        });
        saveAs(dataBlob, 'Amazon_template.xlsx');
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
                `${parent.childrens[parent.childrens.length - 1].image1},${
                    parent.childrens[parent.childrens.length - 1].image2
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

        // Crear libro de trabajo
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pipeline Template');

        // Guardar el archivo
        const excelBuffer: any = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });
        const dataBlob: Blob = new Blob([excelBuffer], {
            type: 'application/octet-stream',
        });
        saveAs(dataBlob, 'Pipeline_template.xlsx');
    }
    generateEtsyTemplate(masterList: any[]) {}
    generateShopifyTemplate(masterList: any[]) {}
    generateFaireTemplate(masterList: any[]) {}

    //--------------------------Funciones especificas de Walmart -----------------------------------

    walmartProductType(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'T-shirts';
            case 'Long Sleeve':
                return 'T-shirts';
            case 'Hoddie':
                return 'Sweatshirts & Hoodies';
            case 'Sweatshirt':
                return 'Sweatshirts & Hoodies';
            case 'Crop Tee':
                return 'Blouses & Tops';
            case 'Crop Top':
                return 'Blouses & Tops';
            case 'Tank Top':
                return 'Tank Tops';
            case 'Racerback Tank':
                return 'Tank Tops';

            default:
                return '';
        }
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
    walmartSleeveLengthStyle(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'Short Sleeve';
            case 'Long Sleeve':
                return 'Long Sleeve';
            case 'Hoddie':
                return 'Long Sleeve';
            case 'Sweatshirt':
                return 'Long Sleeve';
            case 'Crop Tee':
                return 'Short Sleeve';
            case 'Crop Top':
                return 'Short Sleeve';
            case 'Tank Top':
                return 'Sleeveless';
            case 'Racerback Tank':
                return 'Sleeveless';

            default:
                return '';
        }
    }

    //--------------------------Funciones especificas de Amazon -----------------------------------

    amazonProductType(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'SHIRT';
            case 'Long Sleeve':
                return 'SHIRT';
            case 'Hoddie':
                return 'SWEATSHIRT';
            case 'Sweatshirt':
                return 'SWEATSHIRT';
            case 'Crop Tee':
                return 'SHIRT';
            case 'Crop Top':
                return 'SHIRT';
            case 'Tank Top':
                return 'SHIRT';
            case 'Racerback Tank':
                return 'SHIRT';

            default:
                return '';
        }
    }
    amazonItemTypeKeyword(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'fashion-t-shirts';
            case 'Long Sleeve':
                return 'fashion-t-shirts';
            case 'Hoddie':
                return 'fashion-hoodies';
            case 'Sweatshirt':
                return 'fashion-sweatshirt';
            case 'Crop Tee':
                return 'fashion-t-shirts';
            case 'Crop Top':
                return 'fashion-t-shirts';
            case 'Tank Top':
                return 'fashion-t-shirts';
            case 'Racerback Tank':
                return 'fashion-t-shirts';

            default:
                return '';
        }
    }
    amazonStyle(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'Graphic T-shirt';
            case 'Long Sleeve':
                return 'GraphicLong Sleeve';
            case 'Hoddie':
                return 'Graphic Hoddie';
            case 'Sweatshirt':
                return 'Graphic Sweatshirt';
            case 'Crop Tee':
                return 'Graphic Crop Tee';
            case 'Crop Top':
                return 'GraphicCrop Top';
            case 'Tank Top':
                return 'Graphic Tank Top';
            case 'Racerback Tank':
                return 'Graphic Racerback Tank';

            default:
                return '';
        }
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
    amazonSleeveStyle(type: string) {
        switch (type) {
            case 'T-shirt':
                return 'Short Sleeve';
            case 'Long Sleeve':
                return 'Long Sleeve';
            case 'Hoddie':
                return 'Long Sleeve';
            case 'Sweatshirt':
                return 'Long Sleeve';
            case 'Crop Tee':
                return 'Short Sleeve';
            case 'Crop Top':
                return 'Short Sleeve';
            case 'Tank Top':
                return 'Sleeveless';
            case 'Racerback Tank':
                return 'Sleeveless';

            default:
                return '';
        }
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
}

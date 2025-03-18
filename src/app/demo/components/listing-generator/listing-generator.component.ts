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
        { name: 'Mens', value: 'mens' },
        { name: 'Womens', value: 'womens' },
        { name: 'Girls', value: 'girls' },
        { name: 'Boys', value: 'boys' },
        { name: 'Infants', value: 'infants' },
        { name: 'Toddlers', value: 'toddlers' },
        { name: 'Unisex Child', value: 'unisex-child' },
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
                ? this.generalAmazonDepart.value
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

            //Validar Longitud del Titulo
            if (design.title) {
                if (design.title.length > 60) {
                    this.issues.push(
                        `Design "${design.design}" a title that is too long, it should be a maximum of 60 characters. `
                    )
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
    getColorUrlByPodCode(pod_code) {
        const colorObj = this.colors.find((item) => item.pod_code === pod_code);
        return colorObj ? colorObj.url : '';
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
                // console.log(this.ptoDesigns);
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
            console.log(masterList);
            

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
            if (this.selectedMarketplace.includes('Shein')) {
                const wsShein = this.generateSheinTemplate(masterList);
                let category = '';
                switch (this.ptoDesigns[0].categories.Shein) {
                    case 'women t-shirt':
                        category = 'Women T-Shirts(1738)';
                        break;
                    case 'women crop tee':
                        category = 'Women Tops(2214)';
                        break;
                    case 'women sweatshirts':
                        category = 'Women Sweatshirts(1773)';
                        break;
                    case 'women racerback tank':
                        category = 'Women Tank Tops & Camis(1779)';
                        break;
                    case 'men t-shirt':
                        category = 'Men T-Shirts(1978)';
                        break;
                    case 'men tank top':
                        category = 'Men Tank Tops(6505)';
                        break;
                    case 'men hoodies':
                        category = 'Men Hoodies(9099)';
                        break;
                    case 'men sweatshirts':
                        category = 'Men Sweatshirts(1972)';
                        break;

                    default:
                        category = '';
                        break;
                }
                XLSX.utils.book_append_sheet(wb, wsShein, `${category}`);
            }
            if (this.selectedMarketplace.includes('Temu')) {
                const wsTemu = this.generateTemuTemplate(masterList);
                XLSX.utils.book_append_sheet(wb, wsTemu, 'Temu Template');
            }

            // Guardar el archivo Excel combinado
            const excelBuffer: any = XLSX.write(wb, {
                bookType: 'xlsx',
                type: 'array',
            });
            const dataBlob: Blob = new Blob([excelBuffer], {
                type: 'application/octet-stream',
            });
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `Marketplaces_Templates_(PTO-${this.selectedPTO.pto}).xlsx`;

            saveAs(dataBlob, fileName);

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
                                color_url: this.getColorUrlByPodCode(size.color),
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
                                            ? Array.from(new Set(categoryArray)).join(', ')  // Si es array, concatenar con coma
                                            : categoryArray // Si es string, solo mostrar el string tal cual
                                    ]
                                )
                            ),
                            childrens: detail.sizes.map((size) => ({
                                full_sku: size.full_sku,
                                color: this.getColorNameByPodCode(size.color),
                                color_url: this.getColorUrlByPodCode(size.color),
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
                "T-shirt": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+tshirt+chat+size+900x900.jpg",
                "Long Sleeve": "https://chart-size.s3.us-east-1.amazonaws.com/men-long+sleeve+chart+size+900x900.jpg",
                "Tank Top": "https://chart-size.s3.us-east-1.amazonaws.com/men-tank+top+chat+size+900x900.jpg",
                "Sweatshirt": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+sweatshirt+chat+size+900x900.jpg",
                "Hoodie": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+hoodie+chart+size+900x900.jpg",
            },
            WO: {
                "T-shirt": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+tshirt+chat+size+900x900.jpg",
                "Crop Tee": "https://chart-size.s3.us-east-1.amazonaws.com/women-crop+top+chart+size+900x900.jpg",
                "Crop Top": "https://chart-size.s3.us-east-1.amazonaws.com/women-crop+top+chart+size+900x900.jpg",
                "Long Sleeve": "https://chart-size.s3.us-east-1.amazonaws.com/men-long+sleeve+chart+size+900x900.jpg",
                "Racerback Tank": "https://chart-size.s3.us-east-1.amazonaws.com/women-racerback+chart+size+900x900.jpg",
                "Sweatshirt": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+sweatshirt+chat+size+900x900.jpg",
                "Hoodie": "https://chart-size.s3.us-east-1.amazonaws.com/men-women+hoodie+chart+size+900x900.jpg",
            },
            YO: {
                "T-shirt": "https://chart-size.s3.us-east-1.amazonaws.com/youth-tshirt+chart+size+900x900.jpg",
                "Long Sleeve": "",
                "Sweatshirt": "",
                "Hoodie": "https://chart-size.s3.us-east-1.amazonaws.com/youth-hoodie+chart+size+900x900.jpg"
            },
            TO: {
                "T-shirt": "https://chart-size.s3.us-east-1.amazonaws.com/toddler-tshirt+chart+size+900x900.jpg",
                "Long Sleeve": "https://chart-size.s3.us-east-1.amazonaws.com/toddler-long+sleeve+chart+size+900x900.jpg",
                "Sweatshirt": "",
                "Hoodie": "https://chart-size.s3.us-east-1.amazonaws.com/toddler-hoodie+chart+size+900x900.jpg"
            },
            BB: {
                "T-shirt": "https://chart-size.s3.us-east-1.amazonaws.com/baby-tshirt+chart+size+900x900.jpeg",
                "Bodysuit": "https://chart-size.s3.us-east-1.amazonaws.com/baby-bodysuit+chart+size+900x900.jpeg"
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
                    this.colorCategory(child.color), // colorCategory',
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
                    child.mpn, // manufacturerPartNumber',
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
            'Lifestyle',
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
            'Pattern',
            'Special Size',
            'Color Map',
            'Color',
            'Item Length Description',
            'Part Number',
            'Theme',
            'Fit Type',
            'Care Instructions',
            'Is Customizable?',
            'Neck Style',
            'Sleeve Type',
            'Closure Type',
            'Parentage Level',
            'Child Relationship Type',
            'Parent SKU',
            'Variation Theme Name',
            'Country of Origin',
            'Dangerous Goods Regulations',
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
                '', // Is exempt from supplier declared external product identifier
                this.amazonItemTypeKeyword(parent.styles), // Item Type Keyword
                '', // Amazon(CA,AU) - Categorie
                '', // Model Name
                '', // Offering Condition Type
                '', // List Price
                '', // Merchant Shipping Group
                'Made in the USA and Imported', // Import Designation
                'DEFAULT', // Fulfillment Channel Code (US)
                200, // Quantity (US)
                '', // Handling Time (US)
                '', // Your Price USD (Sell on Amazon, US)
                parent.description, // Product Description
                parent.feature1, // Bullet Point
                parent.feature2, // Bullet Point
                parent.feature3, // Bullet Point
                parent.keywords, // Generic Keywords
                'Breathable', // Special Features
                'Absorbent', // Special Features
                'Lightweight', // Special Features
                '', // Lifestyle
                '', // Style
                parent.amazonDepart, // Department Name
                this.amazonTargetGender(parent.amazonDepart), // Target Gender
                this.amazonAgeRangeDesc(parent.classification), // Age Range Description
                '', // Shirt Size System
                '', // Shirt Size Class
                '', // Shirt Size Value
                '', // Shirt Size To Range
                '', // Shirt Body Type
                '', // Shirt Height Type
                '', // Material
                this.amazonFabricType(parent.styles), // Fabric Type
                'Solid', // Pattern
                '', // Special Size
                '', // Color Map
                '', // Color
                '', // Item Length Description
                '', // Part Number
                parent.theme, // Theme
                '', // Fit Type
                'Machine Wash', // Care Instructions
                '', // Is Customizable?
                '', // Neck Style
                '', // Sleeve Type
                '', // Closure Type
                'Parent', // Parentage Level
                'Variation', // Child Relationship Type
                '', // Parent SKU
                'SIZE/COLOR', // Variation Theme Name
                'United States', // Country of Origin
                'Not Applicable', // Dangerous Goods Regulations
                parent.childrens[0].image1, // Main Image URL
                '', // Other Image URL
                '', // Other Image URL
                '', // Other Image URL
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
                    '', //parent.categories.Amazon, // Amazon(CA,AU) - Categorie
                    'N/A', // Model Name
                    'New', // Offering Condition Type
                    child.price, // List Price
                    'Migrated Template', // Merchant Shipping Group
                    'Made in the USA and Imported', // Import Designation
                    'DEFAULT', // Fulfillment Channel Code (US)
                    200, // Quantity (US)
                    '', // Handling Time (US)
                    child.price, // Your Price USD (Sell on Amazon, US)
                    parent.description, // Product Description
                    parent.feature1, // Bullet Point
                    parent.feature2, // Bullet Point
                    parent.feature3, // Bullet Point
                    parent.keywords, // Generic Keywords
                    'Breathable', // Special Features
                    'Absorbent', // Special Features
                    'Lightweight', // Special Features
                    'Casual', // Lifestyle
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
                    '', // Material
                    this.amazonFabricType(parent.styles), // Fabric Type
                    'Solid', // Pattern
                    'Standard', // Special Size
                    this.colorCategory(child.color), // Color Map
                    child.color, // Color
                    'Standard Length', // Item Length Description
                    child.mpn, // Part Number
                    parent.theme, // Theme
                    'Regular Fit', // Fit Type
                    'Machine Wash', // Care Instructions
                    'No', // Is Customizable?
                    'Crew Neck', // Neck Style
                    this.sleeveStyle(parent.styles), // Sleeve Type
                    this.sleeveStyle(parent.styles) == 'Long Sleeve' ? 'Pull On' : '', //Closure Type
                    'Child', // Parentage Level
                    'Variation', // Child Relationship Type
                    parent.parent_sku, // Parent SKU
                    'SIZE/COLOR', // Variation Theme Name
                    'United States', // Country of Origin
                    'Not Applicable', // Dangerous Goods Regulations
                    child.image1, // Main Image URL
                    child.image2, // Other Image URL
                    child.image3, // Other Image URL
                    child.image4, // Other Image URL
                    this.itemWeight(parent.styles), // Package Weight
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
            const randomIndex = Math.floor(Math.random() * parent.childrens.length);
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
                `${parent.childrens[randomIndex].image1},${parent.childrens[randomIndex].image2
                },${parent.childrens[randomIndex].image3}`, //Images
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
                parent.childrens[randomIndex].size, //Attribute 1 default
                'Color', //Attribute 2 name
                this.pipelineGetUniqueColors(parent.childrens), //Attribute 2 value(s)
                1, //Attribute 2 visible
                1, //Attribute 2 global
                parent.childrens[randomIndex].color, //Attribute 2 default
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
            "On Hand Inventory (Read Only)",
            "Restock Date",
            "HS6 Tariff Code"
        ];
        const headerRow2 = [
            "Mandatory",
            "Optional, defaults to Published",
            "Do not edit for exported products. Leave blank for new products.",
            "Optional",
            "Optional",
            "Mandatory",
            "Mandatory if selling by the case. Leave blank for 'By the item' or 'Open sizing'.",
            "Mandatory",
            "Optional",
            "Mandatory if item weight is provided. Select between kg, g, lb, or oz",
            "Optional",
            "Optional",
            "Optional",
            "Mandatory if item dimensions are provided. Select between cm or in",
            "Optional",
            "Mandatory if packaged weight is provided. Select between kg, g, lb, or oz",
            "Optional",
            "Optional",
            "Optional",
            "Mandatory if packaged dimensions are provided. Select between cm or in",
            "Optional, defaults to Published",
            "Optional",
            "Optional",
            "Optional",
            "Mandatory if Option 1 Name is filled",
            "Optional",
            "Mandatory if Option 2 Name is filled",
            "Optional",
            "Mandatory if Option 3 Name is filled",
            "Mandatory",
            "Mandatory",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Mandatory if Preorder",
            "Optional if Preorder",
            "Optional if Preorder",
            "Optional if Preorder",
            "Mandatory for at least 1 row per product, and should contain at least 1 URL or image filename",
            "Optional",
            "Optional, defaults to blank which means there is not a tester",
            "Optional, defaults to blank which means there is not a tester",
            "Optional, defaults to blank which means there is not a tester",
            "Optional, defaults to blank which means there is not a tester",
            "Optional, defaults to blank which means there is not a tester",
            "Optional, default to No",
            "Mandatory for products with customizations",
            "Optional, default to No",
            "Mandatory for products with customizations",
            "Mandatory for products with customizations",
            "Optional, default to $0.00",
            "Optional, default to $0.00",
            "Optional, default to £0.00",
            "Optional, default to €0.00",
            "Optional, default to $0.00",
            "Optional",
            "Optional",
            "Optional",
            "Optional",
            "Optional"
        ];
        const headerRow3 = [
            "product_name_english",
            "info_status_v2",
            "info_product_token",
            "info_product_type",
            "product_description_english",
            "selling_method",
            "case_quantity",
            "minimum_order_quantity",
            "item_weight",
            "item_weight_unit",
            "item_length",
            "item_width",
            "item_height",
            "item_dimensions_unit",
            "packaged_weight",
            "packaged_weight_unit",
            "packaged_length",
            "packaged_width",
            "packaged_height",
            "packaged_dimensions_unit",
            "option_status",
            "sku",
            "gtin",
            "option_1_name",
            "option_1_value",
            "option_2_name",
            "option_2_value",
            "option_3_name",
            "option_3_value",
            "price_wholesale",
            "price_retail",
            "canadian_price_wholesale",
            "canadian_price_retail",
            "uk_price_wholesale",
            "uk_price_retail",
            "eu_price_wholesale",
            "eu_price_retail",
            "australian_price_wholesale",
            "australian_price_retail",
            "option_image",
            "preorderable",
            "ship_by_start_date",
            "ship_by_end_date",
            "order_by_date",
            "keep_active",
            "product_images",
            "made_in_country",
            "tester_price",
            "canadian_tester_price",
            "uk_tester_price",
            "eu_tester_price",
            "australian_tester_price",
            "has_customization",
            "customization_instructions",
            "customization_input_required",
            "customization_input_limit",
            "customization_moq",
            "customization_charge",
            "canadian_customization_charge",
            "uk_customization_charge",
            "eu_customization_charge",
            "australian_customization_charge",
            "continue_selling_when_out_of_stock",
            "on_hand_inventory",
            "on_hand_inventory_original",
            "restock_date",
            "tariff_code"
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
                    this.itemWeight(parent.styles), //Item Weight
                    'oz', //Item Weight Unit
                    '', //Item Length
                    '', //Item Width
                    '', //Item Height
                    '', //Item Dimensions Unit
                    this.itemWeight(parent.styles) + 1, //Packaged Weight
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
                    `${child.image1} ${child.image2} ${child.image3}
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
                    '', //On Hand Inventory (Read Only)
                    '', //Restock Date
                    ''  //HS6 Tariff Code
                ]);
            });
        });

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow1,
            headerRow2,
            headerRow3,
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
    generateSheinTemplate(masterList: any[]) {
        //Women
        const headerWomenTshirt = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Type (109)",
            "Occasion (128)",
            "Hem Shaped (129)",
            "Material (160)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Functional Type (1000104)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Product Model (1000546)",
            "Specific Pattern (1000627)",
            "Style features (1001159)",
            "Temperature (1001364)",
            "Special auxiliary materials (1002021)"
        ];
        const headerWomenCrop = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Filling (1000067)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Chest pad (23)",
            "Details (31)",
            "Fabric (39)",
            "Fit Type (40)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Hem Shaped (129)",
            "Material (160)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Specific Pattern (1000627)",
            "Style features (1001159)",
            "Special auxiliary materials (1002021)"
        ];
        const headerWomenSweatshirt = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Filling (1000067)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Fit Type (40)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Type (109)",
            "Occasion (128)",
            "Hem Shaped (129)",
            "Material (160)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Functional Type (1000104)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Specific Pattern (1000627)",
            "Temperature (1001364)",
            "Special auxiliary materials (1002021)"
        ];
        const headerWomenTank = [
            "Field Code",
            "Default product name[en]",
            "Multilingual product names[es]",
            "Product Number",
            "Default product description[en]",
            "Multilingual product description[es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image1",
            "Detail image2",
            "Detail image3",
            "Detail image4",
            "Detail image5",
            "Detail image6",
            "Detail image7",
            "Detail image8",
            "Detail image9",
            "Seller SKU",
            "Inventory[U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width and height",
            "Original Price[shein-us+USD]",
            "Special Offer Price[shein-us+USD]",
            "Size chart template name",
            "Color(27)",
            "Size(87)",
            "Composition(62)",
            "Filling(1000067)",
            "Lining(1000078)",
            "Coating(1000105)",
            "Belt(9)",
            "Chest pad(23)",
            "Details(31)",
            "Fabric(39)",
            "Fit Type(40)",
            "Length(54)",
            "Body(58)",
            "Neckline(66)",
            "Sleeve Length(90)",
            "Sleeve Type(92)",
            "Style(101)",
            "Type(109)",
            "Occasion(128)",
            "Hem Shaped(129)",
            "Material(160)",
            "Sheer(207)",
            "Features(217)",
            "Care Instructions(1000069)",
            "Quantity(1000411)",
            "Lined For Added Warmth(1000437)",
            "Pockets(1000438)",
            "Specific Pattern(1000627)",
            "Style features(1001159)",
            "Special auxiliary materials(1002021)"
        ];
        const headerWomenHoodie = [
            "Field Code",
            "default product name[en]",
            "Multilingual product names[es]",
            "Product Number",
            "Default product description[en]",
            "Multilingual product description[es]",
            "brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image1",
            "Detail image2",
            "Detail image3",
            "Detail image4",
            "Detail image5",
            "Detail image6",
            "Detail image7",
            "Detail image8",
            "Detail image9",
            "Seller SKU",
            "Inventory[U.S.+PS4343240944]",
            "Weight",
            "unit of weight",
            "Length",
            "Width",
            "Height",
            "unit of length, width and height",
            "Original Price[shein-us+USD]",
            "Special Offer Price[shein-us+USD]",
            "Size chart template name",
            "Color(27)",
            "Size(87)",
            "Composition(62)",
            "Filling(1000067)",
            "Lining(1000078)",
            "Weight of Down(1000097)",
            "Coating(1000105)",
            "Belt(9)",
            "Details(31)",
            "Fabric(39)",
            "Fit Type(40)",
            "Length(54)",
            "Body(58)",
            "Neckline(66)",
            "Placket(74)",
            "Sleeve Length(90)",
            "Sleeve Type(92)",
            "Style(101)",
            "Type(109)",
            "Hem Shaped(129)",
            "Material(160)",
            "Sheer(207)",
            "Features(217)",
            "Care Instructions(1000069)",
            "Quantity(1000411)",
            "Waterproof(1000412)",
            "Lined For Added Warmth(1000437)",
            "Pockets(1000438)",
            "Specific Pattern(1000627)",
            "Temperature(1001364)",
            "Special auxiliary materials(1002021)"
        ];

        //Men
        const headerMenTshirt = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Hem Shaped (129)",
            "Material (160)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Functional Type (1000104)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Product Model (1000546)",
            "Specific Pattern (1000627)",
            "Style features (1001159)",
            "Temperature (1001364)"
        ];
        const headerMenTank = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Fit Type (40)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Pattern Type (73)",
            "Season (77)",
            "Sleeve Length (90)",
            "Style (101)",
            "Hem Shaped (129)",
            "Placket Type (150)",
            "Age (154)",
            "Material (160)",
            "Location (169)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Number of Pieces (1000103)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Other Material (1000547)",
            "Specific Pattern (1000627)"
        ];
        const headerMenHoodie = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Filling (1000067)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Fit Type (40)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Pattern Type (73)",
            "Season (77)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Hem Shaped (129)",
            "Placket Type (150)",
            "Age (154)",
            "Material (160)",
            "Location (169)",
            "Users-Romwe (176)",
            "Users-Shein (177)",
            "Sheer (207)",
            "Features (217)",
            "Care Instructions (1000069)",
            "Number of Pieces (1000103)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Other Material (1000547)",
            "Specific Pattern (1000627)",
            "Temperature (1001364)"
        ];
        const headerMenSweatshirt = [
            "Field Code",
            "Default product name [en]",
            "Multilingual product names [es]",
            "Product Number",
            "Default product description [en]",
            "Multilingual product description [es]",
            "Brand",
            "First Image",
            "Back Image",
            "Square Chart",
            "Color Index Image",
            "Detail image 1",
            "Detail image 2",
            "Detail image 3",
            "Detail image 4",
            "Detail image 5",
            "Detail image 6",
            "Detail image 7",
            "Detail image 8",
            "Detail image 9",
            "Seller SKU",
            "Inventory [U.S.+PS4343240944]",
            "Weight",
            "Unit of weight",
            "Length",
            "Width",
            "Height",
            "Unit of length, width, and height",
            "Original Price [shein-us+USD]",
            "Special Offer Price [shein-us+USD]",
            "Size chart template name",
            "Color (27)",
            "Size (87)",
            "Composition (62)",
            "Filling (1000067)",
            "Lining (1000078)",
            "Coating (1000105)",
            "Belt (9)",
            "Details (31)",
            "Fabric (39)",
            "Fit Type (40)",
            "Length (54)",
            "Body (58)",
            "Neckline (66)",
            "Season (77)",
            "Sleeve Length (90)",
            "Sleeve Type (92)",
            "Style (101)",
            "Type (109)",
            "Hem Shaped (129)",
            "Placket Type (150)",
            "Age (154)",
            "Material (160)",
            "Location (169)",
            "Users-Romwe (176)",
            "Users-Shein (177)",
            "Sheer (207)",
            "Features (217)",
            "Design Style (1000063)",
            "Shoulder Shape (1000066)",
            "Care Instructions (1000069)",
            "Process options (1000410)",
            "Quantity (1000411)",
            "Lined For Added Warmth (1000437)",
            "Pockets (1000438)",
            "Other Material (1000547)",
            "Specific Pattern (1000627)",
            "Temperature (1001364)"
        ];

        console.log(`MasterList: ${masterList[0].categories.Shein}`);
        console.log(`ptoDesign: ${this.ptoDesigns[0].categories.Shein}`);

        const data: any[][] = [];
        masterList.forEach((parent) => {
            parent.childrens.forEach((child: any, index: number) => {
                switch (this.ptoDesigns[0].categories.Shein) {
                    case 'women t-shirt':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            5.3, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton=100', //Composition (62)
                            '', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'Textured', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            'Regular', //Length (54)
                            'Unlined', //Body (58)
                            'Round Neck', //Neckline (66)
                            'Short Sleeve', //Sleeve Length (90)
                            'Regular Sleeve', //Sleeve Type (92)
                            'Casual', //Style (101)
                            '', //Type (109)
                            'Home', //Occasion (128)
                            '', //Hem Shaped (129)
                            'Fabric', //Material (160)
                            'No', //Sheer (207)
                            'Comfortable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            '', //Functional Type (1000104)
                            'piece(s)=1', //Quantity (1000411)
                            'No', //Lined For Added Warmth (1000437)
                            'No', //Pockets (1000438)
                            '', //Product Model (1000546)
                            'Graphic', //Specific Pattern (1000627)
                            'None', //Style features (1001159)
                            '', //Temperature (1001364)
                            '' //Special auxiliary materials (1002021)
                        ]);
                        break;
                    case 'women crop tee':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            child.color_url, //Back Image
                            child.image4, //Square Chart
                            '', //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            5.3, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton=100', //Composition (62)
                            '', //Filling (1000067)
                            '', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'No Padding', //Chest pad (23)
                            'Textured', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            'Regular Fit', //Fit Type (40)
                            'Regular', //Length (54)
                            'Unlined', //Body (58)
                            'Round Neck', //Neckline (66)
                            'Short Sleeve', //Sleeve Length (90)
                            'Regular Sleeve', //Sleeve Type (92)
                            'Casual', //Style (101)
                            '', //Hem Shaped (129)
                            'Fabric', //Material (160)
                            '', //Sheer (207)
                            'Comfortable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            'piece(s)=1', //Quantity (1000411)
                            'No', //Lined For Added Warmth (1000437)
                            'No', //Pockets (1000438)
                            'Graphic', //Specific Pattern (1000627)
                            'None', //Style features (1001159)
                            'Without Drawstrings' //Special auxiliary materials (1002021)
                        ]);
                        break;
                    case 'women sweatshirts':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            10.5, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'cotton*polyester=50*50', //Composition (62)
                            '', //Filling (1000067)
                            '', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'Contrast Binding', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            'Regular Fit', //Fit Type (40)
                            '', //Length (54)
                            'Unlined', //Body (58)
                            'Round Neck', //Neckline (66)
                            'Long Sleeve', //Sleeve Length (90)
                            'Regular Sleeve', //Sleeve Type (92)
                            '', //Style (101)
                            '', //Type (109)
                            '', //Occasion (128)
                            '', //Hem Shaped (129)
                            'Polyester', //Material (160)
                            '', //Sheer (207)
                            'Comfortable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            '', //Functional Type (1000104)
                            'piece(s)=1', //Quantity (1000411)
                            '', //Lined For Added Warmth (1000437)
                            '', //Pockets (1000438)
                            'Graphic', //Specific Pattern (1000627)
                            '', //Temperature (1001364)
                            '' //Special auxiliary materials (1002021)
                        ]);
                        break;
                    case 'women racerback tank':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name[en]
                            '', //Multilingual product names[es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description[en]
                            '', //Multilingual product description[es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image1
                            child.image3, //Detail image2
                            '', //Detail image3
                            '', //Detail image4
                            '', //Detail image5
                            '', //Detail image6
                            '', //Detail image7
                            '', //Detail image8
                            '', //Detail image9
                            child.full_sku, //Seller SKU
                            200, //Inventory[U.S.+PS4343240944]
                            5.3, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width and height
                            child.price, //Original Price[shein-us+USD]
                            '', //Special Offer Price[shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color(27)
                            child.size, //Size(87)
                            'Cotton=100', //Composition(62)
                            '', //Filling(1000067)
                            '', //Lining(1000078)
                            '', //Coating(1000105)
                            'No', //Belt(9)
                            'No Padding', //Chest pad(23)
                            'Textured', //Details(31)
                            'Slight Stretch', //Fabric(39)
                            'Regular Fit', //Fit Type(40)
                            '', //Length(54)
                            'Unlined', //Body(58)
                            'Round Neck', //Neckline(66)
                            'Sleeveless', //Sleeve Length(90)
                            '', //Sleeve Type(92)
                            'Casual', //Style(101)
                            'Tank', //Type(109)
                            'Home*Sports', //Occasion(128)
                            '', //Hem Shaped(129)
                            'Cotton', //Material(160)
                            '', //Sheer(207)
                            'Comfortable', //Features(217)
                            'Machine wash, do not dry clean', //Care Instructions(1000069)
                            'piece(s)=1', //Quantity(1000411)
                            'No', //Lined For Added Warmth(1000437)
                            '', //Pockets(1000438)
                            'Graphic', //Specific Pattern(1000627)
                            'None', //Style features(1001159)
                            'Without Drawstrings' //Special auxiliary materials(1002021)
                        ]);
                        break;
                    case 'women hoodies':
                        data.push([
                            '', //Field Code
                            parent.title, //default product name[en]
                            '', //Multilingual product names[es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description[en]
                            '', //Multilingual product description[es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image1
                            child.image3, //Detail image2
                            '', //Detail image3
                            '', //Detail image4
                            '', //Detail image5
                            '', //Detail image6
                            '', //Detail image7
                            '', //Detail image8
                            '', //Detail image9
                            child.full_sku, //Seller SKU
                            200, //Inventory[U.S.+PS4343240944]
                            20.5, //Weight
                            'oz', //unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //unit of length, width and height
                            child.price, //Original Price[shein-us+USD]
                            '', //Special Offer Price[shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color(27)
                            child.size, //Size(87)
                            'Cotton*Polyester=50*50', //Composition(62)
                            '', //Filling(1000067)
                            '', //Lining(1000078)
                            '', //Weight of Down(1000097)
                            '', //Coating(1000105)
                            'No', //Belt(9)
                            'Textured', //Details(31)
                            'Slight Stretch', //Fabric(39)
                            'Regular Fit', //Fit Type(40)
                            'Long', //Length(54)
                            'Unlined', //Body(58)
                            'Round Neck', //Neckline(66)
                            'Pullover', //Placket(74)
                            'Long Sleeve', //Sleeve Length(90)
                            'Regular Sleeve', //Sleeve Type(92)
                            'Casual', //Style(101)
                            '', //Type(109)
                            '', //Hem Shaped(129)
                            'Fabric', //Material(160)
                            'No', //Sheer(207)
                            'Comfortable', //Features(217)
                            'Machine wash or professional dry clean', //Care Instructions(1000069)
                            'piece(s)=1', //Quantity(1000411)
                            'No', //Waterproof(1000412)
                            'No', //Lined For Added Warmth(1000437)
                            'Yes', //Pockets(1000438)
                            'Graphic', //Specific Pattern(1000627)
                            '', //Temperature(1001364)
                            'Without Drawstrings' //Special auxiliary materials(1002021)
                        ])
                        break;
                    case 'men t-shirt':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            5.3, //Weight
                            'oz', //Unit of weight
                            'Regular', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton=100', //Composition (62)
                            '', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'Textured', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            '', //Length (54)
                            '', //Body (58)
                            'Round Neck', //Neckline (66)
                            'Short Sleeve', //Sleeve Length (90)
                            '', //Sleeve Type (92)
                            'Casual', //Style (101)
                            '', //Hem Shaped (129)
                            'Cotton', //Material (160)
                            '', //Sheer (207)
                            'Comfortable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            '', //Functional Type (1000104)
                            'piece(s)=1', //Quantity (1000411)
                            '', //Lined For Added Warmth (1000437)
                            '', //Pockets (1000438)
                            '', //Product Model (1000546)
                            'Graphic', //Specific Pattern (1000627)
                            'None', //Style features (1001159)
                            '' //Temperature (1001364)
                        ]);
                        break;
                    case 'men tank top':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            5.3, //Weight
                            'oz', //Unit of weight
                            'Regular', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton=100', //Composition (62)
                            '', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'Contrast Binding', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            'Regular Fit', //Fit Type (40)
                            '', //Length (54)
                            '', //Body (58)
                            '', //Neckline (66)
                            'Graphic', //Pattern Type (73)
                            'Spring/Summer', //Season (77)
                            'Sleeveless', //Sleeve Length (90)
                            'Casual', //Style (101)
                            '', //Hem Shaped (129)
                            '', //Placket Type (150)
                            '18-35Y', //Age (154)
                            'Fabric', //Material (160)
                            '', //Location (169)
                            '', //Sheer (207)
                            'Breathable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            '', //Number of Pieces (1000103)
                            'piece(s)=1', //Quantity (1000411)
                            'No', //Lined For Added Warmth (1000437)
                            '', //Pockets (1000438)
                            'Fabric', //Other Material (1000547)
                            'Graphic' //Specific Pattern (1000627)
                        ]);
                        break;
                    case 'men hoodies':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            20.5, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton*Polyester=50*50', //Composition (62)
                            '', //Filling (1000067)
                            'Cotton*Polyester=50*50', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            'Textured', //Details (31)
                            '', //Fabric (39)
                            'Regular Fit', //Fit Type (40)
                            '', //Length (54)
                            'Unlined', //Body (58)
                            'Round Neck', //Neckline (66)
                            'Graphic', //Pattern Type (73)
                            'All', //Season (77)
                            'Long Sleeve', //Sleeve Length (90)
                            '', //Sleeve Type (92)
                            'Casual', //Style (101)
                            '', //Hem Shaped (129)
                            '', //Placket Type (150)
                            '18-35Y', //Age (154)
                            '', //Material (160)
                            'US', //Location (169)
                            '', //Users-Romwe (176)
                            '', //Users-Shein (177)
                            '', //Sheer (207)
                            'Comfortable', //Features (217)
                            'Machine wash, do not dry clean', //Care Instructions (1000069)
                            '', //Number of Pieces (1000103)
                            'piece(s)=1', //Quantity (1000411)
                            '', //Lined For Added Warmth (1000437)
                            '', //Pockets (1000438)
                            'Other Material', //Other Material (1000547)
                            'Specific Pattern', //Specific Pattern (1000627)
                            '' //Temperature (1001364)
                        ]);
                        break;
                    case 'men sweatshirts':
                        data.push([
                            '', //Field Code
                            parent.title, //Default product name [en]
                            '', //Multilingual product names [es]
                            parent.parent_sku, //Product Number
                            parent.description, //Default product description [en]
                            '', //Multilingual product description [es]
                            '', //Brand
                            child.image1, //First Image
                            '', //Back Image
                            child.image4, //Square Chart
                            child.color_url, //Color Index Image
                            child.image2, //Detail image 1
                            child.image3, //Detail image 2
                            '', //Detail image 3
                            '', //Detail image 4
                            '', //Detail image 5
                            '', //Detail image 6
                            '', //Detail image 7
                            '', //Detail image 8
                            '', //Detail image 9
                            child.full_sku, //Seller SKU
                            200, //Inventory [U.S.+PS4343240944]
                            10.5, //Weight
                            'oz', //Unit of weight
                            '', //Length
                            '', //Width
                            '', //Height
                            '', //Unit of length, width, and height
                            child.price, //Original Price [shein-us+USD]
                            '', //Special Offer Price [shein-us+USD]
                            '', //Size chart template name
                            child.color, //Color (27)
                            child.size, //Size (87)
                            'Cotton=100', //Composition (62)
                            '', //Filling (1000067)
                            'Cotton=100', //Lining (1000078)
                            '', //Coating (1000105)
                            'No', //Belt (9)
                            '', //Details (31)
                            'Slight Stretch', //Fabric (39)
                            'Regular Fit', //Fit Type (40)
                            '', //Length (54)
                            'Unlined', //Body (58)
                            '', //Neckline (66)
                            'All', //Season (77)
                            'Long Sleeve', //Sleeve Length (90)
                            '', //Sleeve Type (92)
                            '', //Style (101)
                            '', //Type (109)
                            '', //Hem Shaped (129)
                            'Pullovers', //Placket Type (150)
                            '18-35Y', //Age (154)
                            'Fabric', //Material (160)
                            'US', //Location (169)
                            '', //Users-Romwe (176)
                            '', //Users-Shein (177)
                            'No', //Sheer (207)
                            'Features', //Features (217)
                            'Casual', //Design Style (1000063)
                            '', //Shoulder Shape (1000066)
                            'Hand wash,do not dry clean', //Care Instructions (1000069)
                            '', //Process options (1000410)
                            'piece(s)=1', //Quantity (1000411)
                            '', //Lined For Added Warmth (1000437)
                            '', //Pockets (1000438)
                            'Cotton', //Other Material (1000547)
                            'Graphic', //Specific Pattern (1000627)
                            '' //Temperature (1001364)
                        ]);
                        break;

                    default:
                        data.push([]);
                        break;
                }
            });
        });
        let headerRow

        // A partir del 1er valor de categorias se definira el tipo de archivo que se exportara
        switch (this.ptoDesigns[0].categories.Shein) {
            case 'women t-shirt':
                headerRow = headerWomenTshirt;
                break;
            case 'women crop tee':
                headerRow = headerWomenCrop;
                break;
            case 'women sweatshirts':
                headerRow = headerWomenSweatshirt;
                break;
            case 'women racerback tank':
                headerRow = headerWomenTank;
                break;
            case 'women hoodies':
                headerRow = headerWomenHoodie;
                break;
            case 'men t-shirt':
                headerRow = headerMenTshirt;
                break;
            case 'men tank top':
                headerRow = headerMenTank;
                break;
            case 'men hoodies':
                headerRow = headerMenHoodie;
                break;
            case 'men sweatshirts':
                headerRow = headerMenSweatshirt;
                break;

            default:
                headerRow = [];
                break;
        }

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
            headerRow,
            ...data,
        ]);

        return ws;
        // // Crear libro de trabajo
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Shein Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Shein_template.xlsx');
    }
    generateTemuTemplate(masterList: any[]) {
        const headerRow1 = [
            "Category",
            "Product Name",
            "Contribution Goods",
            "Contribution SKU",
            "Product Description",
            "Bullet Point",
            "Bullet Point",
            "Bullet Point",
            "Detail Images URL",
            "Detail Images URL",
            "Detail Images URL",
            "12 - Material",
            "15 - Composition: Cotton",
            "15 - Composition: Polyester",
            "26 - Pattern",
            "83 - Details",
            "21 - Collar Style",
            "19 - Style",
            "20 - Operation Instruction",
            "22 - Fabric",
            "115 - Applicable People",
            "76 - Season",
            "24 - Sheer",
            "27 - Sleeve Type",
            "29 - Sleeve Length",
            "28 - Length",
            "114 - Fit Type",
            "1192 - Weaving Method",
            "1919 - Printing Type",
            "6926 - Fabric Texture 1",
            "6930 - Fabric Weight 1 (g/m²) - value",
            "6930 - Fabric Weight 1 (g/m²) - unit",
            "6928 - Lining Texture",
            "6934 - Lining Weight (g/m²) - value",
            "6934 - Lining Weight (g/m²) - unit",
            "6547 - Lining Ingredients: Polyester",
            "6547 - Lining Ingredients: Cotton",
            "Variation Theme",
            "Size Family",
            "Sub-Size Family",
            "Size",
            "Color",
            "Unit",
            "US Size",
            "3 - Tops - Product - Chest",
            "3 - Tops - Product - Length",
            "SKU Images URL (x10)",
            "Quantity",
            "Base Price - USD",
            "List Price - USD",
            "Weight - lb",
            "Length - in",
            "Width - in",
            "Height - in",
            "Handling Time",
            "Shipping Template",
            "Import Designation",
            "Fulfillment Channel",
            "Country/Region of Origin",
            "California Proposition 65 Warning Type"
        ];

        const data: any[][] = [];
        masterList.forEach((parent) => {
            parent.childrens.forEach((child: any, index: number) => {
                data.push([
                    parent.categories.Temu, //Category
                    parent.title, //Product Name
                    parent.parent_sku, //Contribution Goods
                    child.full_sku, //Contribution SKU
                    parent.description, //Product Description
                    parent.feature1, //Bullet Point
                    parent.feature2, //Bullet Point
                    parent.feature3, //Bullet Point
                    child.image1, //Detail Images URL
                    child.image2, //Detail Images URL
                    child.image4, //Detail Images URL
                    this.temuMaterial(parent.styles), //12 - Material
                    this.percentCotton(parent.styles), //15 - Composition: Cotton
                    this.percentPolyester(parent.styles), //15 - Composition: Polyester
                    'Solid color', //26 - Pattern
                    'None', //83 - Details
                    'Crew Neck', //21 - Collar Style
                    'Casual', //19 - Style
                    'Machine wash, do not dry clean', //20 - Operation Instruction
                    'Non-Stretch', //22 - Fabric
                    this.temuAgeGroup(parent.classification), //115 - Applicable People
                    'All-season', //76 - Season
                    'No', //24 - Sheer
                    'Regular Sleeve', //27 - Sleeve Type
                    this.sleeveStyle(parent.styles), //29 - Sleeve Length
                    'Short Length', //28 - Length
                    'Regular', //114 - Fit Type
                    'Non-woven Fabric', //1192 - Weaving Method
                    'Positioning Printing', //1919 - Printing Type
                    'Smooth fabric', //6926 - Fabric Texture 1
                    180, //6930 - Fabric Weight 1 (g/m²) - value
                    'g/m²', //6930 - Fabric Weight 1 (g/m²) - unit
                    'Smooth fabric', //6928 - Lining Texture
                    180, //6934 - Lining Weight (g/m²) - value
                    'g/m²', //6934 - Lining Weight (g/m²) - unit
                    this.percentPolyester(parent.styles), //6547 - Lining Ingredients: Polyester
                    this.percentCotton(parent.styles), //6547 - Lining Ingredients: Cotton
                    'Color × Size', //Variation Theme
                    '10000 - US/EU size', //Size Family
                    '10 - Alpha', //Sub-Size Family
                    this.temuTranslateSize(child.size), //Size
                    child.color, //Color
                    'in-lbs-fl oz', //Unit
                    this.temuTranslateSize(child.size), //US Size
                    this.itemChest(child.size, parent.styles), //3 - Tops - Product - Chest
                    this.itemLength(child.size, parent.styles), //3 - Tops - Product - Length
                    child.image2, //SKU Images URL (x10)
                    200, //Quantity
                    child.price, //Base Price - USD
                    child.price, //List Price - USD
                    this.itemWeight(parent.styles), //Weight - lb
                    this.itemLength(child.size, parent.styles), //Length - in
                    this.itemWidth(child.size, parent.styles), //Width - in
                    this.itemHeight(child.size, parent.styles), //Height - in
                    '2 Days', //Handling Time
                    'Shipping Address', //Shipping Template
                    'Made in the USA and Imported', //Import Designation
                    'I will ship this item myself', //Fulfillment Channel
                    'United States', //Country/Region of Origin
                    'No Warning Applicable' //California Proposition 65 Warning Type
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
        // XLSX.utils.book_append_sheet(wb, ws, 'Temu Template');

        // // Guardar el archivo
        // const excelBuffer: any = XLSX.write(wb, {
        //     bookType: 'xlsx',
        //     type: 'array',
        // });
        // const dataBlob: Blob = new Blob([excelBuffer], {
        //     type: 'application/octet-stream',
        // });
        // saveAs(dataBlob, 'Temu_template.xlsx');
    }

    //--------------------------Funciones especificas de Walmart -----------------------------------

    walmartProductType(type: string): string {
        const productTypeMap: { [key: string]: string } = {
            'T-shirt': 'T-shirts',
            'T-shirt Color': 'T-shirts',
            'Tie Dye Crystal': 'T-shirts',
            'Tie Dye Cyclone': 'T-shirts',
            'Tie Dye Spiral': 'T-shirts',
            'Long Sleeve': 'T-shirts',
            'Hoddie': 'Sweatshirts & Hoodies',
            'Sweatshirt': 'Sweatshirts & Hoodies',
            'Crop Tee': 'Blouses & Tops',
            'Crop Top': 'Blouses & Tops',
            'Tank Top': 'Tank Tops',
            'Racerback Tank': 'Tank Tops',
        };
        const normalizedType = type.trim();
        return productTypeMap[normalizedType] || '';
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
        const productTypeMap: { [key: string]: string } = {
            'T-shirt': 'SHIRT',
            'T-shirt Color': 'SHIRT',
            'Tie Dye Crystal': 'SHIRT',
            'Tie Dye Cyclone': 'SHIRT',
            'Tie Dye Spiral': 'SHIRT',
            'Long Sleeve': 'SHIRT',
            'Hoddie': 'SWEATSHIRT',
            'Sweatshirt': 'SWEATSHIRT',
            'Crop Tee': 'SHIRT',
            'Crop Top': 'SHIRT',
            'Tank Top': 'SHIRT',
            'Racerback Tank': 'SHIRT',
        };
        const normalizedType = type.trim();
        return productTypeMap[normalizedType] || '';
    }
    amazonItemTypeKeyword(type: string) {
        const productTypeMap: { [key: string]: string } = {
            'T-shirt': 'fashion-t-shirts',
            'T-shirt Color': 'fashion-t-shirts',
            'Tie Dye Crystal': 'fashion-t-shirts',
            'Tie Dye Cyclone': 'fashion-t-shirts',
            'Tie Dye Spiral': 'fashion-t-shirts',
            'Long Sleeve': 'fashion-t-shirts',
            'Hoddie': 'fashion-hoodies',
            'Sweatshirt': 'fashion-sweatshirt',
            'Crop Tee': 'fashion-t-shirts',
            'Crop Top': 'fashion-t-shirts',
            'Tank Top': 'fashion-t-shirts',
            'Racerback Tank': 'fashion-t-shirts',
        }
        const normalizedType = type.trim();
        return productTypeMap[normalizedType] || '';
    }
    amazonStyle(type: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': 'Graphic T-shirt',
            'T-shirt Color': 'Graphic T-shirt',
            'Tie Dye Crystal': 'Graphic T-shirt',
            'Tie Dye Cyclone': 'Graphic T-shirt',
            'Tie Dye Spiral': 'Graphic T-shirt',
            'Long Sleeve': 'Graphic Long Sleeve',
            'Hoddie': 'Graphic Hoddie',
            'Sweatshirt': 'Graphic Sweatshirt',
            'Crop Tee': 'Graphic Crop Tee',
            'Crop Top': 'Graphic Crop Top',
            'Tank Top': 'Graphic Tank Top',
            'Racerback Tank': 'Graphic Racerback Tank',
        }
        const normalizedType = type.trim();
        return productStyleMap[normalizedType] || '';
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
    amazonFabricType(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': '100% Cotton',
            'T-shirt Color': '100% Cotton',
            'Tie Dye Crystal': '100% Cotton',
            'Tie Dye Cyclone': '100% Cotton',
            'Tie Dye Spiral': '100% Cotton',
            'Long Sleeve': '100% Cotton',
            'Hoddie': '50% Cotton, 50% Polyester',
            'Sweatshirt': '75% Cotton, 25% Polyester',
            'Crop Tee': '100% Cotton',
            'Crop Top': '100% Cotton',
            'Tank Top': '50% Cotton, 50% Polyester',
            'Racerback Tank': '60% Cotton, 40% Polyester',
            'Bodysuit': '100% Cotton',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
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
    faireMaterial(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': '100% US Cotton',
            'T-shirt Color': '100% US Cotton',
            'Tie Dye Crystal': '100% US Cotton',
            'Tie Dye Cyclone': '100% US Cotton',
            'Tie Dye Spiral': '100% US Cotton',
            'Long Sleeve': '100% US Cotton',
            'Hoddie': '50% US Cotton / 50% Polyester',
            'Sweatshirt': '75% US Cotton / 25% Recycled Polyester',
            'Crop Tee': '100% US Cotton',
            'Crop Top': '100% US Cotton',
            'Tank Top': '50% US Cotton / 50% Polyester',
            'Racerback Tank': '60% Combed Ring-Spun Cotton, 40% Polyester',
            'Bodysuit': '100% combed ring-spun cotton',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }
    faireWholesalePrice(style: string) {
        const productPriceMap: { [key: string]: number } = {
            'T-shirt': 25.00,
            'T-shirt Color': 25.00,
            'Tie Dye Crystal': 25.00,
            'Tie Dye Cyclone': 25.00,
            'Tie Dye Spiral': 25.00,
            'Long Sleeve': 27.00,
            'Hoddie': 40.00,
            'Sweatshirt': 30.00,
            'Crop Tee': 25.00,
            'Crop Top': 25.00,
            'Tank Top': 20.00,
            'Racerback': 20.00,
            'Bodysuit': 15.00,
        }
        const normalizedType = style.trim();
        return productPriceMap[normalizedType] || '';
    }

    //--------------------------Funciones especificas de Shopify -----------------------------------

    shopifyHandler(title: string) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
    }
    shopifyProductType(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': 'T-shirt',
            'T-shirt Color': 'T-shirt',
            'Tie Dye Crystal': 'T-shirt',
            'Tie Dye Cyclone': 'T-shirt',
            'Tie Dye Spiral': 'T-shirt',
            'Long Sleeve': 'T-shirt',
            'Hoddie': 'Sweatshirts & Hoodies',
            'Sweatshirt': 'Sweatshirts & Hoodies',
            'Crop Tee': 'T-shirt',
            'Crop Top': 'T-shirt',
            'Tank Top': 'T-shirt',
            'Racerback': 'T-shirt'
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
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

    //--------------------------Funciones especificas de Shein -----------------------------------

    sheinMaterial(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': '100% US Cotton',
            'T-shirt Color': '100% US Cotton',
            'Tie Dye Crystal': '100% US Cotton',
            'Tie Dye Cyclone': '100% US Cotton',
            'Tie Dye Spiral': '100% US Cotton',
            'Long Sleeve': '100% US Cotton',
            'Hoddie': '50% US Cotton / 50% Polyester',
            'Sweatshirt': '75% US Cotton / 25% Recycled Polyester',
            'Crop Tee': '100% US Cotton',
            'Crop Top': '100% US Cotton',
            'Tank Top': '50% US Cotton / 50% Polyester',
            'Racerback Tank': '60% Combed Ring-Spun Cotton, 40% Polyester',
            'Bodysuit': '100% combed ring-spun cotton',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }

    //--------------------------Funciones especificas de Temu -----------------------------------

    temuMaterial(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': 'Cotton',
            'T-shirt Color': 'Cotton',
            'Tie Dye Crystal': 'Cotton',
            'Tie Dye Cyclone': 'Cotton',
            'Tie Dye Spiral': 'Cotton',
            'Long Sleeve': 'Cotton',
            'Hoddie': 'Cotton & Polyester',
            'Sweatshirt': 'Cotton & Polyester',
            'Crop Tee': 'Cotton',
            'Crop Top': 'Cotton',
            'Tank Top': 'Cotton & Polyester',
            'Racerback Tank': 'Cotton & Polyester',
            'Bodysuit': 'Cotton',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }
    temuAgeGroup(classification: string) {
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
    temuTranslateSize(size) {
        switch (size) {
            case 'XS':
                return 'XS';
            case 'S':
                return 'S';
            case 'M':
                return 'M';
            case 'L':
                return 'L';
            case 'XL':
                return 'XL';
            case '2XL':
                return 'XXL';
            case '3XL':
                return 'XXXL';
            case '4XL':
                return '4XL';
            case '5XL':
                return '5XL';

            default:
                return '';
        }
    }

    //-------------------------- General Funtions ------------------------------

    colorCategory(color: string) {
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
                'Royal',
                'Light Blue'
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
                'Ash',
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
                'Lime'
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
                'Heliconia',
                'Light Pink'
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
            Yellow: ['Yellow', 'Pale Yellow', 'Neon Yellow', 'Maize Yellow', 'Daisy'],
        };

        for (const [group, colors] of Object.entries(colorGroup)) {
            if (colors.includes(color)) {
                return group;
            }
        }

        return '';
    }
    sleeveStyle(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': 'Short Sleeve',
            'T-shirt Color': 'Short Sleeve',
            'Tie Dye Crystal': 'Short Sleeve',
            'Tie Dye Cyclone': 'Short Sleeve',
            'Tie Dye Spiral': 'Short Sleeve',
            'Long Sleeve': 'Long Sleeve',
            'Hoddie': 'Long Sleeve',
            'Sweatshirt': 'Long Sleeve',
            'Crop Tee': 'Short Sleeve',
            'Crop Top': 'Short Sleeve',
            'Tank Top': 'Sleeveless',
            'Racerback Tank': 'Sleeveless',
            'Bodysuit': 'Short Sleeve',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }
    percentCotton(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': '100',
            'T-shirt Color': '100',
            'Tie Dye Crystal': '100',
            'Tie Dye Cyclone': '100',
            'Tie Dye Spiral': '100',
            'Long Sleeve': '100',
            'Hoddie': '50',
            'Sweatshirt': '75',
            'Crop Tee': '100',
            'Crop Top': '100',
            'Tank Top': '50',
            'Racerback Tank': '60',
            'Bodysuit': '100',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }
    percentPolyester(style: string) {
        const productStyleMap: { [key: string]: string } = {
            'T-shirt': '',
            'T-shirt Color': '',
            'Tie Dye Crystal': '',
            'Tie Dye Cyclone': '',
            'Tie Dye Spiral': '',
            'Long Sleeve': '',
            'Hoddie': '50',
            'Sweatshirt': '25',
            'Crop Tee': '',
            'Crop Top': '',
            'Tank Top': '50',
            'Racerback Tank': '40',
            'Bodysuit': '',
        }
        const normalizedType = style.trim();
        return productStyleMap[normalizedType] || '';
    }
    itemWeight(style: string) {
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
    itemChest(size, style) {
        const chestSizes = {
            "T-shirt": { "XS": 32, "S": 36, "M": 40, "L": 44, "XL": 48, "2XL": 52, "3XL": 56, "4XL": 60, "5XL": 64, "2T": 20, "3T": 22, "4T": 24, "5T": 26, "NB": 16, "6M": 17, "12M": 18, "18M": 19, "24M": 20 },
            "Hoodie": { "XS": 34, "S": 38, "M": 42, "L": 46, "XL": 50, "2XL": 54, "3XL": 58, "4XL": 62, "5XL": 66, "2T": 22, "3T": 24, "4T": 26, "5T": 28 },
            "Sweatshirt": { "XS": 34, "S": 38, "M": 42, "L": 46, "XL": 50, "2XL": 54, "3XL": 58, "4XL": 62, "5XL": 66, "2T": 22, "3T": 24, "4T": 26, "5T": 28 },
            "Long Sleeve": { "XS": 32, "S": 36, "M": 40, "L": 44, "XL": 48, "2XL": 52, "3XL": 56, "4XL": 60, "5XL": 64, "2T": 20, "3T": 22, "4T": 24, "5T": 26 },
            "Crop Tee": { "XS": 32, "S": 34, "M": 36, "L": 38, "XL": 40, "2XL": 42, "3XL": 44 },
            "Crop Top": { "XS": 32, "S": 34, "M": 36, "L": 38, "XL": 40, "2XL": 42, "3XL": 44 },
            "Tank Top": { "XS": 30, "S": 34, "M": 38, "L": 42, "XL": 46, "2XL": 50, "3XL": 54, "4XL": 58, "5XL": 62 },
            "Racerback Tank": { "XS": 30, "S": 34, "M": 38, "L": 42, "XL": 46, "2XL": 50, "3XL": 54, "4XL": 58, "5XL": 62 },
            "Bodysuit": { "NB": 16, "6M": 17, "12M": 18, "18M": 19, "24M": 20 }
        };
    
        return chestSizes[style]?.[size] ?? 0;
    }
    itemLength(size, style) {
        const lengthChart = {
            "T-shirt": {"2T": 15, "3T": 16, "4T": 17, "5T": 18,"NB": 11, "6M": 12, "12M": 13, "18M": 14, "24M": 15,"XS": 14.75, "S": 15.62, "M": 17, "L": 18.5, "XL": 20,"2XL": 21.5, "3XL": 22.87, "4XL": 24.25, "5XL": 25.37 },
            "Bodysuit": { "NB": 11, "6M": 12, "12M": 13, "18M": 14, "24M": 15 },
            "Hoodie": { "2T": 15, "3T": 16, "4T": 17, "5T": 18, "XS": 32, "S": 33, "M": 34, "L": 35, "XL": 36, "2XL": 37, "3XL": 38, "4XL": 39, "5XL": 40 },
            "Sweatshirt": { "2T": 15, "3T": 16, "4T": 17, "5T": 18, "XS": 32, "S": 33, "M": 34, "L": 35, "XL": 36, "2XL": 37, "3XL": 38, "4XL": 39, "5XL": 40 },
            "Long Sleeve": { "2T": 15, "3T": 16, "4T": 17, "5T": 18, "XS": 32, "S": 33, "M": 34, "L": 35, "XL": 36, "2XL": 37, "3XL": 38, "4XL": 39, "5XL": 40 },
            'Crop Tee': { "XS": 15.75, "S": 16.75, "M": 18, "L": 19.5, "XL": 20.75, '2XL': 22 },
            'Crop Top': { "XS": 15.75, "S": 16.75, "M": 18, "L": 19.5, "XL": 20.75, '2XL': 22 },
            'Tank Top': { "XS": 14.75, "S": 15.62, "M": 17, "L": 18.5, "XL": 20,"2XL": 21.5, "3XL": 22.87, "4XL": 24.25, "5XL": 25.37 },
            'Racerback Tank': { "XS": 14.75, "S": 15.62, "M": 17, "L": 18.5, "XL": 20,"2XL": 21.5, "3XL": 22.87, "4XL": 24.25, "5XL": 25.37 },
        };

        return lengthChart[style]?.[size] ?? 0.00;
    }
    itemWidth(size, style) {
        const widths = {
            "T-shirt": { "XS": 27, "S": 28, "M": 29, "L": 30, "XL": 31, "2XL": 32, "3XL": 33, "4XL": 34, "5XL": 35, "2T": 12, "3T": 13, "4T": 14, "5T": 15, "NB": 10, "6M": 10.5, "12M": 11, "18M": 11.5, "24M": 12 },
            "Hoodie": { "XS": 25, "S": 26, "M": 27, "L": 28, "XL": 29, "2XL": 30, "3XL": 31, "4XL": 32, "5XL": 33, "2T": 13, "3T": 14, "4T": 15, "5T": 16 },
            "Sweatshirt": { "XS": 25, "S": 26, "M": 27, "L": 28, "XL": 29, "2XL": 30, "3XL": 31, "4XL": 32, "5XL": 33, "2T": 13, "3T": 14, "4T": 15, "5T": 16 },
            "Long Sleeve": { "XS": 16, "S": 18, "M": 20, "L": 22, "XL": 24, "2XL": 26, "3XL": 28, "4XL": 30, "5XL": 32, "2T": 12, "3T": 13, "4T": 14, "5T": 15 },
            "Crop Tee": { "XS": 16, "S": 17, "M": 18, "L": 19, "XL": 20, "2XL": 21, "3XL": 22 },
            "Crop Top": { "XS": 16, "S": 17, "M": 18, "L": 19, "XL": 20, "2XL": 21, "3XL": 22 },
            "Tank Top": { "XS": 14, "S": 16, "M": 18, "L": 20, "XL": 22, "2XL": 24, "3XL": 26, "4XL": 28, "5XL": 30 },
            "Racerback Tank": { "XS": 14, "S": 16, "M": 18, "L": 20, "XL": 22, "2XL": 24, "3XL": 26, "4XL": 28, "5XL": 30 },
            "Bodysuit": { "NB": 8, "6M": 8.5, "12M": 9, "18M": 9.5, "24M": 10 }
        };

        return widths[style]?.[size] ?? 0;
    }
    itemHeight(size, style) {
        const heights = {
            "T-shirt": { "XS": 16, "S": 18, "M": 20, "L": 22, "XL": 24, "2XL": 26, "3XL": 28, "4XL": 30, "5XL": 32, "2T": 15, "3T": 16, "4T": 17, "5T": 18, "NB": 12, "6M": 13, "12M": 14, "18M": 15, "24M": 16 },
            "Hoodie": { "XS": 18, "S": 20, "M": 22, "L": 24, "XL": 26, "2XL": 28, "3XL": 30, "4XL": 32, "5XL": 34, "2T": 16, "3T": 17, "4T": 18, "5T": 19 },
            "Sweatshirt": { "XS": 18, "S": 20, "M": 22, "L": 24, "XL": 26, "2XL": 28, "3XL": 30, "4XL": 32, "5XL": 34, "2T": 16, "3T": 17, "4T": 18, "5T": 19 },
            "Long Sleeve": { "XS": 26, "S": 28, "M": 29, "L": 30, "XL": 31, "2XL": 32, "3XL": 33, "4XL": 34, "5XL": 35, "2T": 15, "3T": 16, "4T": 17, "5T": 18 },
            "Crop Tee": { "XS": 16, "S": 17, "M": 18, "L": 19, "XL": 20, "2XL": 21, "3XL": 22 },
            "Crop Top": { "XS": 16, "S": 17, "M": 18, "L": 19, "XL": 20, "2XL": 21, "3XL": 22 },
            "Tank Top": { "XS": 25, "S": 26, "M": 27, "L": 28, "XL": 29, "2XL": 30, "3XL": 31, "4XL": 32, "5XL": 33 },
            "Racerback Tank": { "XS": 25, "S": 26, "M": 27, "L": 28, "XL": 29, "2XL": 30, "3XL": 31, "4XL": 32, "5XL": 33 },
            "Bodysuit": { "NB": 14, "6M": 15, "12M": 16, "18M": 17, "24M": 18 }
        };

        return heights[style]?.[size] ?? 0;
    }
}

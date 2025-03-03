import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { ElectronService } from '../../service/electron.service';
import { MockupGeneratorService } from '../../service/mockup-generator.service';

@Component({
  selector: 'app-mockup-generator',
  templateUrl: './mockup-generator.component.html',
  styleUrls: ['./mockup-generator.component.scss'],
  providers: [MessageService],
})
export class MockupGeneratorComponent implements OnInit {
  @ViewChild('uploader') uploader: FileUpload;

  files = [];
  uploaded: boolean = false;

  type: any[] | undefined;
  categories: any[] | undefined;
  printArea: any[] | undefined;
  color: any[] | undefined;

  selectedType: any | undefined;
  selectedCategory: any | undefined;
  selectedPrintArea: any | undefined;
  selectedColors: any | undefined;
  selectedMockupAmount: number = 2;
  downloadPath: string = "C:\\Users\\loren\\Documents\\0-MOCKUPS GENERATOR";

  mockups: any[] = [];
  errors: string[] = [];
  activeSpinner: boolean = false;
  activeSpinnerUpdate: boolean = false;

  constructor(
    private messageService: MessageService,
    private electronService: ElectronService,
    private mockupGeneratorService: MockupGeneratorService
  ) { }

  ngOnInit() {
    this.type = [
      { name: 'Tshirts', code: 'tshirt' },
      { name: 'Tank Tops', code: 'tanktop' },
      { name: 'Sweatshirts', code: 'sweatshirt' },
      { name: 'Hoodies', code: 'hoodie' },
      { name: 'Long sleeves', code: 'longsleeve' },
      { name: 'Crop Tee', code: 'croptee' },
      { name: 'Racerback Tank', code: 'racerback' },
      { name: 'Bodysuit', code: 'bodysuit' }
    ];
    this.categories = [
      { name: 'Men', code: 'men' },
      { name: 'Women', code: 'women' },
      { name: 'Youth-girl', code: 'youth-girl' },
      { name: 'Youth-boy', code: 'youth-boy' },
      { name: 'Toddler-girl', code: 'toddler-girl' },
      { name: 'Toddler-boy', code: 'toddler-boy' },
      { name: 'Infant-girl', code: 'infant-girl' },
      { name: 'Infant-boy', code: 'infant-boy' }
    ];
    this.printArea = [
      { name: 'Front', code: 'front' },
      { name: 'Back', code: 'back' },
      // { name: 'Pocket', code: 'pocket' }
    ];
    this.color = [
      { "name": "Amethyst", "code": "#6c4b94" },
      { "name": "Antique Cherry Red", "code": "#971b2f" },
      { "name": "Antique Heliconia", "code": "#aa0061" },
      { "name": "Antique Irish Green", "code": "#00843d" },
      { "name": "Antique Jade Dome", "code": "#6269" },
      { "name": "Antique Orange", "code": "#b33d26" },
      { "name": "Antique Royal", "code": "#3087" },
      { "name": "Antique Sapphire", "code": "#006a8e" },
      { "name": "Ash", "code": "#c8c9c7" },
      { "name": "Ash Grey", "code": "#c8c9c7" },
      { "name": "Azalea", "code": "#dd74a1" },
      { "name": "Baby Blue", "code": "#69b3e7" },
      { "name": "Berry", "code": "#7f2952" },
      { "name": "Black", "code": "#25282a" },
      { "name": "Blackberry", "code": "#221c35" },
      { "name": "Blue Dusk", "code": "#253746" },
      { "name": "Bright Salmon", "code": "#e5554f" },
      { "name": "Brown Savana", "code": "#7a6855" },
      { "name": "Cactus", "code": "#788a7a" },
      { "name": "Cardinal Red", "code": "#8a1538" },
      { "name": "Caribbean Blue", "code": "#00a9ce" },
      { "name": "Caribbean Mist", "code": "#00a9ce" },
      { "name": "Carolina Blue", "code": "#7ba4db" },
      { "name": "Carolina Blue Mist", "code": "#7ba4db" },
      { "name": "Cement", "code": "#aeaeae" },
      { "name": "Chalky Mint", "code": "#5cb8b2" },
      { "name": "Chambray", "code": "#bdd6e6" },
      { "name": "Charcoal", "code": "#66676c" },
      { "name": "Charity Pink", "code": "#f8a3bc" },
      { "name": "Cherry Red", "code": "#ac2b37" },
      { "name": "Chestnut", "code": "#83635c" },
      { "name": "Cobalt", "code": "#171c8f" },
      { "name": "Coral Silk", "code": "#fb637e" },
      { "name": "Cornsilk", "code": "#f0ec74" },
      { "name": "Daisy", "code": "#fed101" },
      { "name": "Dark Chocolate", "code": "#382f2d" },
      { "name": "Dark Heather", "code": "#425563" },
      { "name": "Dune Mist", "code": "#7a7256" },
      { "name": "Dusty Rose", "code": "#e1bbb4" },
      { "name": "Electric Green", "code": "#43b02a" },
      { "name": "Flo Blue", "code": "#5576d1" },
      { "name": "Forest Green", "code": "#273b33" },
      { "name": "Galapagos Blue", "code": "#005d6f" },
      { "name": "Garnet", "code": "#7d2935" },
      { "name": "Gold", "code": "#eead1a" },
      { "name": "Graphite Heather", "code": "#707372" },
      { "name": "Gravel", "code": "#888b8d" },
      { "name": "Gunmetal", "code": "#939694" },
      { "name": "Heather Berry", "code": "#994878" },
      { "name": "Heather Blue", "code": "#3a5dae" },
      { "name": "Heather Bronze", "code": "#c04c36" },
      { "name": "Heather Cardinal", "code": "#9b2743" },
      { "name": "Heather Caribbean Blue", "code": "#00afd7" },
      { "name": "Heather Coral Silk", "code": "#ff808b" },
      { "name": "Heather Dark Green", "code": "#3e5d58" },
      { "name": "Heather Grey", "code": "#9ea2a2" },
      { "name": "Heather Heliconia", "code": "#e24585" },
      { "name": "Heather Indigo", "code": "#4d6995" },
      { "name": "Heather Irish Green", "code": "#5caa7f" },
      { "name": "Heather Maroon", "code": "#672e45" },
      { "name": "Heather Military Green", "code": "#7e7f74" },
      { "name": "Heather Navy", "code": "#333f48" },
      { "name": "Heather Orange", "code": "#ff8d6d" },
      { "name": "Heather Purple", "code": "#614b79" },
      { "name": "Heather Radiant Orchid", "code": "#a15a95" },
      { "name": "Heather Red", "code": "#bf0d3e" },
      { "name": "Heather Royal", "code": "#307fe2" },
      { "name": "Heather Sapphire", "code": "#0076a8" },
      { "name": "Heather Seafoam", "code": "#40c1ac" },
      { "name": "Heather Sport Dark Maroon", "code": "#651d32" },
      { "name": "Heather Sport Dark Navy", "code": "#595478" },
      { "name": "Heather Sport Royal", "code": "#1d4f91" },
      { "name": "Heather Sport Scarlet Red", "code": "#b83a4b" },
      { "name": "Heliconia", "code": "#db3e79" },
      { "name": "Honey", "code": "#f6c25b" },
      { "name": "Ice Grey", "code": "#d7d2cb" },
      { "name": "Indigo Blue", "code": "#486d87" },
      { "name": "Iris", "code": "#3975b7" },
      { "name": "Irish Green", "code": "#00a74a" },
      { "name": "Island Reef", "code": "#8fd6bd" },
      { "name": "Jade Dome", "code": "#00857d" },
      { "name": "Kelly Green", "code": "#00805e" },
      { "name": "Kelly Mist", "code": "#00805e" },
      { "name": "Kiwi", "code": "#89a84f" },
      { "name": "Lagoon Blue", "code": "#4ac3e0" },
      { "name": "Legion Blue", "code": "#1f495b" },
      { "name": "Light Blue", "code": "#a3b3cb" },
      { "name": "Light Blue", "code": "#a4c8e1" },
      { "name": "Light Pink", "code": "#e4c6d4" },
      { "name": "Lilac", "code": "#563d82" },
      { "name": "Lime", "code": "#92bf55" },
      { "name": "Marbled Charcoal", "code": "#66676c" },
      { "name": "Marbled Galapagos Blue", "code": "#005d6f" },
      { "name": "Marbled Heliconia", "code": "#db3e79" },
      { "name": "Marbled Navy", "code": "#263147" },
      { "name": "Marbled Royal", "code": "#224d8f" },
      { "name": "Maroon", "code": "#5b2b42" },
      { "name": "Maroon Mist", "code": "#6d273c" },
      { "name": "Meadow", "code": "#046a38" },
      { "name": "Metro Blue", "code": "#464e7e" },
      { "name": "Midnight", "code": "#567070" },
      { "name": "Military Green", "code": "#5e7461" },
      { "name": "Mint Green", "code": "#a0cfa8" },
      { "name": "Moss", "code": "#3d441e" },
      { "name": "Mustard", "code": "#c3964d" },
      { "name": "Natural", "code": "#e7ceb5" },
      { "name": "Navy", "code": "#263147" },
      { "name": "Navy Mist", "code": "#2c4068" },
      { "name": "Neon Blue", "code": "#0c51a3" },
      { "name": "Neon Green", "code": "#93da49" },
      { "name": "Old Gold", "code": "#c39367" },
      { "name": "Olive", "code": "#4a412a" },
      { "name": "Orange", "code": "#f4633a" },
      { "name": "Orchid", "code": "#c5b4e3" },
      { "name": "Paragon", "code": "#948794" },
      { "name": "Pistachio", "code": "#a9c47f" },
      { "name": "Pitch Black", "code": "#101820" },
      { "name": "Pitch Black Mist", "code": "#2d2926" },
      { "name": "Plumrose", "code": "#c9809e" },
      { "name": "Prairie Dust", "code": "#7a7256" },
      { "name": "Purple", "code": "#464e7e" },
      { "name": "Red", "code": "#d50032" },
      { "name": "Royal", "code": "#224d8f" },
      { "name": "Royal Mist", "code": "#456db0" },
      { "name": "Russet", "code": "#512f2e" },
      { "name": "Safety Green", "code": "#c6d219" },
      { "name": "Safety Orange", "code": "#e5801c" },
      { "name": "Safety Pink", "code": "#e16f8f" },
      { "name": "Sage", "code": "#819e87" },
      { "name": "Sand", "code": "#cabfad" },
      { "name": "Sapphire", "code": "#0077b5" },
      { "name": "Seafoam", "code": "#487a7b" },
      { "name": "Sky", "code": "#71c5e8" },
      { "name": "Slate", "code": "#b3aaa4" },
      { "name": "Smoke", "code": "#3d3935" },
      { "name": "Sport Dark Green", "code": "#205c40" },
      { "name": "Sport Dark Maroon", "code": "#572932" },
      { "name": "Sport Dark Navy", "code": "#00263a" },
      { "name": "Sport Grey", "code": "#97999b" },
      { "name": "Sport Purple", "code": "#470a68" },
      { "name": "Sport Royal", "code": "#002d72" },
      { "name": "Sport Scarlet Red", "code": "#ba0c2f" },
      { "name": "Steel Blue", "code": "#294f5a" },
      { "name": "Stone Blue", "code": "#7e93a7" },
      { "name": "Storm Grey", "code": "#898d8d" },
      { "name": "Sunset", "code": "#dc6b2f" },
      { "name": "Tan", "code": "#bd9a7a" },
      { "name": "Tangerine", "code": "#ff8a3d" },
      { "name": "Teal Ice", "code": "#b1e4e3" },
      { "name": "Tennessee Orange", "code": "#b65a30" },
      { "name": "Terracota", "code": "#e3775e" },
      { "name": "Tropical Blue", "code": "#00859b" },
      { "name": "True Red", "code": "#bb1237" },
      { "name": "Turf Green", "code": "#007a3e" },
      { "name": "Tweed", "code": "#4b4f54" },
      { "name": "Vegas Gold", "code": "#f4d1a1" },
      { "name": "Violet", "code": "#8094dd" },
      { "name": "White", "code": "#ffffff" },
      { "name": "Yellow Haze", "code": "#f6c25b" }
    ]

  }

  validation(data) {
    this.errors.length = 0; // Limpiar la lista antes de validar

    if (!data.category) this.errors.push("category");
    if (!data.type) this.errors.push("type");
    if (!data.printArea) this.errors.push("printArea");
    if (!data.colors) this.errors.push("colors");
  }

  async upload(event) {
    try {
      const files = event.files;
      const data = {
        category: this.selectedCategory?.code,
        type: this.selectedType?.code,
        printArea: this.selectedPrintArea?.code,
        colors: this.selectedColors?.map(color => {
          return color.code
        }),
        amount: this.selectedMockupAmount
      };
      console.log(data);

      this.validation(data);
      if (this.errors.length > 0) {
        this.messageService.add({
          key: 'bc',
          severity: 'error',
          summary: 'Datos Incompletos',
          detail: 'Debe completar los campos en ROJO para poder continuar',
        });
        return;
      }

      this.activeSpinner = true;
      const response = await this.mockupGeneratorService.generateMockups(files, data);

      const groupedMockups = Object.values(
        response.generatedMockups.reduce((acc, item) => {
          if (!acc[item.design]) {
            acc[item.design] = {
              design: item.design,
              design_path: item.design_path,
              images: []
            };
          }
          acc[item.design].images.push({
            mockup_name: item.mockup_name,
            download_path: item.download_path
          });
          return acc;
        }, {})
      );

      this.mockups = groupedMockups;
      console.log(this.mockups);
      this.activeSpinner = false;

    } catch (error) {
      console.log(error);
      this.activeSpinner = false;
      if (error.error) {
        this.messageService.add({
          key: 'bc',
          severity: 'error',
          summary: 'Error',
          detail: `Ha ocurrido un error: ${error.error.msg}`,
        });
      } else {
        this.messageService.add({
          key: 'bc',
          severity: 'error',
          summary: 'Error',
          detail: `Ha ocurrido un error: ${error.message}`,
        });
      }

    }
  }

  onSelectedFiles(event) {
    this.mockups = [];
    this.files = event.currentFiles;
    console.log(this.files);
  }

  onClear() {
    this.files = [];
    this.mockups = [];
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

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${size} ${sizes[i]}`;
  }

  async updateMockups() {
    try {
      this.activeSpinnerUpdate = true;
      const response = await this.mockupGeneratorService.updateMockups();
      console.log(response);
      this.activeSpinnerUpdate = false;
      this.messageService.add({
        key: 'bc',
        severity: 'success',
        summary: 'Mockups Updated',
        detail: `${response.message}, total: ${response.total}`,
      });
    } catch (error) {
      console.error(error);
      if (error.error) {
        this.messageService.add({
          key: 'bc',
          severity: 'error',
          summary: 'Error',
          detail: `Ha ocurrido un error: ${error.error.msg}`,
        });
      } else {
        this.messageService.add({
          key: 'bc',
          severity: 'error',
          summary: 'Error',
          detail: `Ha ocurrido un error: ${error.message}`,
        });
      }
    }


  }

  async openFolderDialog() {
    this.downloadPath = await this.electronService.selectFolder();
  }

}

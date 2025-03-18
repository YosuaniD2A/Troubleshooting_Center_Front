import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { InfoGeneratorService } from '../../service/info-generator.service';
import { ComponentCanDeactivate } from '../../guards/upload.guard';

@Component({
  selector: 'app-mockup-generator',
  templateUrl: './info-generator.component.html',
  styleUrls: ['./info-generator.component.scss'],
  providers: [MessageService],
})
export class InfoGeneratorComponent implements OnInit, ComponentCanDeactivate {
  @ViewChild('uploader') uploader: FileUpload;

  files = [];
  data = [];
  mockups: any[] = [];
  metadata: any[] | undefined;
  selectedMetadata: any | null = null;
  hasUnsavedChanges: boolean;

  uploaded: boolean = false;
  activeSpinner: boolean = false;
  activeSpinnerUpdate: boolean = false;

  data_info: any | null = null;
  visible: boolean = false;

  constructor(
    private messageService: MessageService,
    private infoGeneratorService: InfoGeneratorService
  ) { }

  ngOnInit() {

    this.metadata = [
      {
        name: 'SwiftPod',
      },
      {
        name: 'Tshirtguys',
      }
    ];
  }

  canDeactivate(): boolean {
    if (this.hasUnsavedChanges) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  async upload(event) {
    try {
      this.activeSpinner = true;

      //await new Promise(resolve => setTimeout(resolve, 60000));

      const files = event.files;

      const fileUrls = files.map(file => ({
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(file)
      }));

      const response = await this.infoGeneratorService.generateInfo_GPT(files);
      console.log(response);      

      this.data = response.map(item => {
        const matchedFile = fileUrls.find(f => f.name === item.file);
        return matchedFile ? { ...item, objectURL: matchedFile.url } : item;
      });

      this.hasUnsavedChanges = true
      this.activeSpinner = false;
    } catch (error) {
      console.log(error);
      this.activeSpinner = false;
      const errorMsg = error.error?.msg || error.message || 'Error desconocido';
      this.messageService.add({
        key: 'bc',
        severity: 'error',
        summary: 'Error',
        detail: `Ha ocurrido un error: ${errorMsg}`,
      });
    }
  }

  async saveMetadata() {
    try {
      // TODO - Guardar los datos generados en su respectiva tabla de metadatos
      this.data_info = this.data.map((elem) => ({
        metadata: this.selectedMetadata.name,
        filename: elem.file,
        title: elem.title,
        keywords: Array.isArray(elem.keywords) ? elem.keywords.join(',') : elem.keywords || ''
      }));

      if(this.data_info){
        const response = await this.infoGeneratorService.saveMetadata(this.data_info);
        this.onClear();
        this.hasUnsavedChanges = false;
  
        if(response.success){
          this.messageService.add({
            key: 'bc',
            severity: 'success',
            summary: 'Success',
            detail: `The generated data were successfully saved.`,
          });
        }
      }
    
    } catch (error) {
      console.log(error);
      this.activeSpinner = false;
      this.visible = true;
      const errorMsg = error.error?.msg || error.message || 'Error desconocido';
      this.messageService.add({
        key: 'bc',
        severity: 'error',
        summary: 'Error',
        detail: `Ha ocurrido un error: ${errorMsg}`,
      });
    }

  }

  autoExport() {
    this.visible = false;
  
    if (!this.data_info || this.data_info.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }
  
    // Crear encabezados del CSV con las claves del primer objeto
    const headers = Object.keys(this.data_info[0]).join(',') + '\n';
  
    // Crear las filas del CSV
    const rows = this.data_info.map(obj =>
      Object.values(obj)
        .map(value => {
          // Escapar comillas dobles y envolver en comillas si hay comas
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ).join('\n');
  
    const csvContent = headers + rows;
  
    // Crear el archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
  
    // Crear enlace para descarga
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Generated_Info.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  
    // Liberar memoria
    window.URL.revokeObjectURL(url);

    this.onClear();
  }
  

  assign(event) {
    this.selectedMetadata = event.value;
  }

  onSelectedFiles(event) {
    this.files = event.currentFiles;
    console.log(this.files);
  }

  onClear() {
    this.files = [];
    this.data = [];
    this.uploaded = false;
    this.uploader.clear();
    this.hasUnsavedChanges = false;
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


}

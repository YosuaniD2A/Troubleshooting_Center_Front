import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceRaw'
})
export class ReplaceRaw implements PipeTransform {

    transform(value: string): string {
        if (!value) return value; // Si el valor es nulo o indefinido, retornarlo sin cambios
        // return value.replace(/raw=1/g, 'dl=1');
        return value.replace('www.dropbox.com', 'uc1b159ebd4329305ad6249ec81b.dl.dropboxusercontent.com');
      }

}
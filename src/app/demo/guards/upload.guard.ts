import { Injectable } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
    canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

export const uploadGuard: CanDeactivateFn<ComponentCanDeactivate> = (
    component: ComponentCanDeactivate
): Observable<boolean> | boolean | Promise<boolean> => {
    return component.canDeactivate ? component.canDeactivate() : true;
};

import { Routes } from '@angular/router';
import { AnotherComponent } from './another/another.component';
import { CustomEditorComponent } from './custom-editor/custom-editor.component';

export const routes: Routes = [
  {
    path: 'custom-editor',
    component: CustomEditorComponent,
  },
  {
    path: 'another',
    component: AnotherComponent,
  },
];

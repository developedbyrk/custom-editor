import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomEditorComponent } from '../custom-editor/custom-editor.component';

@Component({
  selector: 'app-another',
  standalone: true,
  imports: [CustomEditorComponent, CommonModule],
  templateUrl: './another.component.html', // Create this file
  styleUrl: './another.component.scss', // Optionally create this file for specific styles
})
export class AnotherComponent {
  showEditorWithToolbar: boolean = true;
  showEditorWithoutToolbar: boolean = true; // You can control this with your logic

  toggleToolbar(): void {
    this.showEditorWithToolbar = !this.showEditorWithToolbar;
  }
}

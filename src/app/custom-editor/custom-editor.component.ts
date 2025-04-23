import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-editor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './custom-editor.component.html',
  styleUrl: './custom-editor.component.scss',
})
export class CustomEditorComponent {
  @ViewChild('editor') editorRef!: ElementRef;
  @ViewChild('linkUrlInput') linkUrlInputRef!: ElementRef;
  @ViewChild('imageUrlInput') imageUrlInputRef!: ElementRef;
  @ViewChild('imageUploadInput') imageUploadInputRef!: ElementRef;
  @ViewChild('linkDialog') linkDialogRef!: ElementRef;
  @ViewChild('imageDialog') imageDialogRef!: ElementRef;
  @ViewChild('linkOptionsToolbar') linkOptionsToolbarRef!: ElementRef;
  @ViewChild('inlineLinkInput') inlineLinkInputRef!: ElementRef; // Reference to the inline input

  @Input() showToolbar: boolean = true;

  showLinkDialog = false;
  showImageDialog = false;
  private savedSelection: Range | null = null;
  currentLink: HTMLAnchorElement | null = null; // Ensure it's HTMLAnchorElement
  isLinkOptionsVisible: boolean = false;
  linkOptionsPosition: { top: number; left: number } = { top: 0, left: 0 };
  isEditingLink: boolean = false;
  isInlineEditLinkVisible: boolean = false;
  inlineEditorPosition: { top: number; left: number } = { top: 0, left: 0 };
  showBlockDropdown: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  applyFormat(command: string, value?: string): void {
    this.editorRef.nativeElement.focus();
    document.execCommand(command, false, value);
  }

  applyList(command: string): void {
    this.editorRef.nativeElement.focus();
    document.execCommand(command, false);
  }

  applyBlockFormat(blockType: string): void {
    if (blockType) {
      this.editorRef.nativeElement.focus();
      document.execCommand('formatBlock', false, blockType);
      this.showBlockDropdown = false; // Close the dropdown after selection
    }
  }

  toggleBlockDropdown(): void {
    this.showBlockDropdown = !this.showBlockDropdown;
  }

  openLinkDialog(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedSelection = selection.getRangeAt(0);
    } else {
      this.savedSelection = null;
    }
    this.showLinkDialog = true;
    this.isEditingLink = false; // Reset editing flag
    this.isInlineEditLinkVisible = false; // Ensure inline editor is hidden
    setTimeout(() => this.linkUrlInputRef.nativeElement.focus(), 0);
  }

  openImageDialog(): void {
    this.showImageDialog = true;
    this.isInlineEditLinkVisible = false; // Ensure inline editor is hidden
  }

  closeDialog(): void {
    this.showLinkDialog = false;
    this.showImageDialog = false;
    this.editorRef.nativeElement.focus();
    this.hideLinkOptions(); // Hide link options when dialogs are closed
    this.isEditingLink = false;
    this.currentLink = null;
    this.isInlineEditLinkVisible = false; // Ensure inline editor is hidden
    this.showBlockDropdown = false; // Ensure dropdown is closed
  }

  insertLink(): void {
    const url = this.linkUrlInputRef.nativeElement.value;
    this.editorRef.nativeElement.focus();

    if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
      document.execCommand('createLink', false, url);
      this.savedSelection = null;
    } else {
      document.execCommand('insertText', false, url);
      const newSelection = window.getSelection();
      const range = document.createRange();
      const lastChild = this.editorRef.nativeElement.lastChild;
      if (lastChild && lastChild.textContent === url) {
        range.selectNodeContents(lastChild);
        newSelection?.removeAllRanges();
        newSelection?.addRange(range);
      }
    }
    this.closeDialog();
  }

  insertImageFromUrl(): void {
    this.editorRef.nativeElement.focus();
    const url = this.imageUrlInputRef.nativeElement.value;
    document.execCommand('insertImage', false, url);
    this.closeDialog();
  }

  uploadImage(event: any): void {
    this.editorRef.nativeElement.focus();
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imageUrl = e.target.result;
        document.execCommand('insertImage', false, imageUrl);
        this.closeDialog();
      };
      reader.readAsDataURL(file);
    }
  }

  @HostListener('click', ['$event'])
  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      this.isLinkOptionsVisible &&
      this.linkOptionsToolbarRef &&
      this.linkOptionsToolbarRef.nativeElement.contains(target)
    ) {
      return;
    }
    if (
      this.showBlockDropdown &&
      !(event.target as Element)?.closest('.dropdown')
    ) {
      this.showBlockDropdown = false;
    }

    if (target.tagName === 'A') {
      this.showLinkOptions(target as HTMLAnchorElement);
      event.preventDefault();
    } else {
      this.hideLinkOptions();
      this.isInlineEditLinkVisible = false; // Hide inline editor when clicking away from a link
    }
  }

  showLinkOptions(linkElement: HTMLAnchorElement): void {
    this.currentLink = linkElement;
    this.isLinkOptionsVisible = true;
    this.isInlineEditLinkVisible = false; // Hide the larger dialog if it was open
    this.linkOptionsPosition = {
      top: linkElement.offsetTop - 30,
      left: linkElement.offsetLeft,
    };
  }

  hideLinkOptions(): void {
    this.isLinkOptionsVisible = false;
    this.isInlineEditLinkVisible = false; // Also hide the inline editor when hiding options
  }

  enableInlineEditLink(): void {
    if (this.currentLink) {
      console.log('enableInlineEditLink called');
      this.isInlineEditLinkVisible = true;
      this.inlineEditorPosition = {
        top: this.currentLink.offsetTop + this.currentLink.offsetHeight + 5, // Position below the link
        left: this.currentLink.offsetLeft,
      };
      console.log('isInlineEditLinkVisible:', this.isInlineEditLinkVisible);
      console.log('inlineEditorPosition:', this.inlineEditorPosition);
      setTimeout(() => this.inlineLinkInputRef?.nativeElement.focus(), 0);
      this.hideLinkOptions(); // Hide the options toolbar
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }

  applyInlineEditLink(): void {
    if (this.currentLink && this.inlineLinkInputRef?.nativeElement.value) {
      this.currentLink.href = this.inlineLinkInputRef.nativeElement.value;
      console.log('Link updated to:', this.currentLink.href);
    }
    this.isInlineEditLinkVisible = false;
    this.editorRef.nativeElement.focus();
  }

  cancelInlineEditLink(): void {
    console.log('cancelInlineEditLink called');
    this.isInlineEditLinkVisible = false;
    this.editorRef.nativeElement.focus();
  }

  removeLink(): void {
    if (this.currentLink) {
      const text = this.currentLink.textContent || '';
      const textNode = document.createTextNode(text);
      this.currentLink.parentNode?.insertBefore(textNode, this.currentLink);
      this.currentLink.parentNode?.removeChild(this.currentLink);
      this.currentLink = null;
      this.hideLinkOptions();
      this.isInlineEditLinkVisible = false;
      this.editorRef.nativeElement.focus();
    }
  }
}

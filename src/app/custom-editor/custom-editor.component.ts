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
  isNewLink: boolean = true;

  showLinkDialog = false;
  showImageDialog = false;
  showImageUrlInput = false; // Initially hide the URL input
  private savedSelection: Range | null = null;
  currentLink: HTMLAnchorElement | null = null; // Ensure it's HTMLAnchorElement
  isLinkOptionsVisible: boolean = false;
  linkOptionsPosition: { top: number; left: number } = { top: 0, left: 0 };
  isEditingLink: boolean = false;
  // isInlineEditLinkVisible: boolean = false;
  inlineEditorPosition: { top: number; left: number } = { top: 0, left: 0 };
  showBlockDropdown: boolean = false;
  savedHtmlContent: string | null = null;
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
    this.showImageDialog = false; // Ensure image dialog is closed
    this.showImageUrlInput = false; // Ensure image dialog is closed
    console.log('openLinkDialog() called');
    const selection = window.getSelection();
    this.savedSelection = null; // Reset savedSelection every time the dialog is opened

    if (selection && selection.rangeCount > 0 && !this.isEditingLink) {
      this.savedSelection = selection.getRangeAt(0);
    }

    this.showLinkDialog = true;
    console.log('showLinkDialog:', this.showLinkDialog);

    setTimeout(() => {
      if (this.linkUrlInputRef) {
        if (this.isEditingLink && this.currentLink) {
          this.linkUrlInputRef.nativeElement.value = this.currentLink.href;
        } else {
          this.linkUrlInputRef.nativeElement.value = ''; // Clear the input for new links
        }
        this.linkUrlInputRef.nativeElement.focus();
      } else {
        console.warn('linkUrlInputRef is not yet available.');
      }
    }, 0);
  }

  openImageDialog(): void {
    this.showLinkDialog = false; // Ensure link dialog is closed
    this.showImageDialog = true;
    this.showImageUrlInput = false; // Reset to upload view
    // this.isInlineEditLinkVisible = false; // Ensure inline editor is hidden
  }

  toggleImageUrlInput(): void {
    this.showImageUrlInput = !this.showImageUrlInput;
  }

  closeDialog(): void {
    this.showLinkDialog = false;
    this.showImageDialog = false;
    this.editorRef.nativeElement.focus();
    this.hideLinkOptions();
    this.currentLink = null;
    // this.isInlineEditLinkVisible = false;
    this.showBlockDropdown = false;
    this.isEditingLink = false; // Reset editing flag on close
  }

  insertLink(): void {
    const url = this.linkUrlInputRef.nativeElement.value;
    this.editorRef.nativeElement.focus();

    if (this.isEditingLink && this.currentLink) {
      this.currentLink.href = url;
    } else if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
      document.execCommand('createLink', false, url);
      this.savedSelection = null;
    } else if (this.isNewLink) {
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
    this.isEditingLink = false;
    this.isNewLink = true; // Reset the flag
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
      // this.isInlineEditLinkVisible = false; // Hide inline editor when clicking away from a link
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault(); // Prevent the default paste behavior

    const text = (event.clipboardData || (window as any).clipboard).getData(
      'text'
    );

    if (text) {
      document.execCommand('insertText', false, text);
    }
  }

  showLinkOptions(linkElement: HTMLAnchorElement): void {
    this.currentLink = linkElement;
    this.isLinkOptionsVisible = true;
    // this.isInlineEditLinkVisible = false; // Hide the larger dialog if it was open
    this.linkOptionsPosition = {
      top: linkElement.offsetTop - 30,
      left: linkElement.offsetLeft,
    };
  }

  hideLinkOptions(): void {
    this.isLinkOptionsVisible = false;
    // this.isInlineEditLinkVisible = false; // Also hide the inline editor when hiding options
  }

  enableInlineEditLink(): void {
    if (this.currentLink) {
      this.isEditingLink = true;
      this.isNewLink = false; // Indicate that this is not a new link
      this.openLinkDialog();
      this.hideLinkOptions();
    }
  }

  removeLink(): void {
    if (this.currentLink) {
      const text = this.currentLink.textContent || '';
      const textNode = document.createTextNode(text);
      this.currentLink.parentNode?.insertBefore(textNode, this.currentLink);
      this.currentLink.parentNode?.removeChild(this.currentLink);
      this.currentLink = null;
      this.hideLinkOptions();
      // this.isInlineEditLinkVisible = false;
      this.editorRef.nativeElement.focus();
    }
  }

  saveContent(): void {
    this.savedHtmlContent = this.editorRef.nativeElement.innerHTML;
  }
}

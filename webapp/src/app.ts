// TypeScript definitions for ag-grid
declare const agGrid: any;

interface ChurchDataRecord {
  Title: string;
  'Issue #': string;
  'MHC Grade': string;
  'MHC Price': string;
  'CGC Grade': string;
  'Page Quality': string;
  Note: string;
  Year: string;
  Publisher: string;
  Comments: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: ChurchDataRecord[];
  error?: string;
  message?: string;
}

class ChurchDataApp {
  private gridApi: any;

  constructor() {
    this.initializeGrid();
    this.loadData();
    this.setupQuickFilter();
    this.setupContactModal();
  }

  private initializeGrid(): void {
    const gridOptions = {
      columnDefs: [
        { 
          field: 'Title', 
          headerName: 'Title',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          minWidth: 150
        },
        { 
          field: 'Issue #', 
          headerName: 'Issue #',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: 100
        },
        { 
          field: 'Year', 
          headerName: 'Year',
          filter: 'agNumberColumnFilter',
          sortable: true,
          resizable: true,
          width: 80
        },
        { 
          field: 'Publisher', 
          headerName: 'Publisher',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          minWidth: 150
        },
        { 
          field: 'MHC Grade', 
          headerName: 'MHC Grade',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: 120
        },
        { 
          field: 'CGC Grade', 
          headerName: 'CGC Grade',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: 120
        },
        { 
          field: 'Page Quality', 
          headerName: 'Page Quality',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: 130
        },
        { 
          field: 'MHC Price', 
          headerName: 'MHC Price',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: 120
        },
        { 
          field: 'Note', 
          headerName: 'Note',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          minWidth: 100
        },
        { 
          field: 'Comments', 
          headerName: 'Comments',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          minWidth: 100
        }
      ],
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      pagination: true,
      paginationPageSize: 50,
      animateRows: true,
      onGridReady: (params: any) => {
        this.gridApi = params.api;
      }
    };

    const gridDiv = document.querySelector('#myGrid');
    if (gridDiv) {
      this.gridApi = agGrid.createGrid(gridDiv, gridOptions);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch('/api/church-data');
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        this.updateStats(result.count, result.data);
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', result.data);
          this.gridApi.sizeColumnsToFit();
        }
      } else {
        this.showError(result.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to connect to the server. Please ensure the server is running.');
    }
  }

  private updateStats(count: number, data: ChurchDataRecord[]): void {
    const statsDiv = document.getElementById('stats');
    if (!statsDiv) return;

    // Calculate some basic statistics
    const publishers = new Set(data.map(record => record.Publisher).filter(p => p));
    const years = data.map(record => parseInt(record.Year)).filter(y => !isNaN(y));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    statsDiv.innerHTML = `
      <h3>Collection Statistics</h3>
      <p><strong>${count.toLocaleString()}</strong> total records</p>
      <p><strong>${publishers.size}</strong> unique publishers</p>
      <p>Years: <strong>${minYear}</strong> - <strong>${maxYear}</strong></p>
    `;
  }

  private showError(message: string): void {
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  private setupQuickFilter(): void {
    const quickFilterInput = document.getElementById('quickFilter') as HTMLInputElement;
    if (quickFilterInput) {
      quickFilterInput.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (this.gridApi) {
          this.gridApi.setGridOption('quickFilterText', target.value);
        }
      });
    }
  }

  private setupContactModal(): void {
    const contactLink = document.getElementById('contact-link');
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.querySelector('.close') as HTMLElement;
    const cancelBtn = document.getElementById('cancel-btn');
    const contactForm = document.getElementById('contact-form') as HTMLFormElement;
    
    // Open modal when contact link is clicked
    if (contactLink) {
      contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (modal) modal.style.display = 'block';
      });
    }
    
    // Close modal when close button is clicked
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }
    
    // Close modal when cancel button is clicked
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal) modal.style.display = 'none';
      }
    });
    
    // Handle form submission
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameField = document.getElementById('contact-name') as HTMLInputElement;
        const emailField = document.getElementById('contact-email') as HTMLInputElement;
        const messageField = document.getElementById('contact-message') as HTMLTextAreaElement;
        
        const name = nameField?.value || '';
        const email = emailField?.value || '';
        const message = messageField?.value || '';
        
        // Create mailto link with form data
        const subject = encodeURIComponent('Edgar Church Collection - Update from ' + name);
        const body = encodeURIComponent(
          `Name: ${name}\n` +
          `Email: ${email}\n\n` +
          `Message:\n${message}\n\n` +
          `--\n` +
          `Sent from Edgar Church Collection webapp`
        );
        
        const mailtoLink = `mailto:rob.react@gmail.com?subject=${subject}&body=${body}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Close modal and reset form
        if (modal) modal.style.display = 'none';
        contactForm.reset();
      });
    }
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChurchDataApp();
});
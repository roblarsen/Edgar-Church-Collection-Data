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
  }

  
  private initializeGrid(): void {
    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
  
    const gridOptions = {
      columnDefs: [
        { 
          field: 'Title', 
          headerName: 'Title',
          filter: 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          minWidth: 150,
          valueFormatter: (params:any) => toTitleCase(params.value),
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
      <p><strong>${count.toLocaleString()}</strong> total records, 
      <strong>${publishers.size}</strong> unique publishers</p>
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
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChurchDataApp();
});
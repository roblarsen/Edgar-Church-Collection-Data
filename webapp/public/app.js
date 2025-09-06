class ChurchDataApp {
    constructor() {
        this.initializeGrid();
        this.loadData();
        this.setupQuickFilter();
    }
    initializeGrid() {
        const toTitleCase = (str) => {
            if (!str)
                return '';
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
        const gridOptions = {
            columnDefs: [
                {
                    field: 'Title',
                    headerName: 'Title',
                    filter: 'agTextColumnFilter',
                    sortable: true,
                    resizable: true,
                    minWidth: 150,
                    valueFormatter: (params) => toTitleCase(params.value),
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
            onGridReady: (params) => {
                this.gridApi = params.api;
            }
        };
        const gridDiv = document.querySelector('#myGrid');
        if (gridDiv) {
            this.gridApi = agGrid.createGrid(gridDiv, gridOptions);
        }
    }
    async loadData() {
        try {
            const response = await fetch('/api/church-data');
            const result = await response.json();
            if (result.success && result.data) {
                this.updateStats(result.count, result.data);
                if (this.gridApi) {
                    this.gridApi.setGridOption('rowData', result.data);
                    this.gridApi.sizeColumnsToFit();
                }
            }
            else {
                this.showError(result.error || 'Failed to load data');
            }
        }
        catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to connect to the server. Please ensure the server is running.');
        }
    }
    updateStats(count, data) {
        const statsDiv = document.getElementById('stats');
        if (!statsDiv)
            return;
        // Calculate some basic statistics
        const publishers = new Set(data.map(record => record.Publisher).filter(p => p));
        const years = data.map(record => parseInt(record.Year)).filter(y => !isNaN(y));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        // Calculate average CGC grade
        const cgcGrades = data
            .map(record => record['CGC Grade'])
            .filter(grade => grade && grade.trim() !== '')
            .map(grade => parseFloat(grade))
            .filter(grade => !isNaN(grade) && grade >= 0.1 && grade <= 10);
        const avgCgcGrade = cgcGrades.length > 0
            ? (cgcGrades.reduce((sum, grade) => sum + grade, 0) / cgcGrades.length).toFixed(1)
            : 'N/A';
        statsDiv.innerHTML = `
      <h3>Collection Statistics</h3>
      <p><strong>${count.toLocaleString()}</strong> total records, 
      <strong>${publishers.size}</strong> unique publishers</p>
      <p>Years: <strong>${minYear}</strong> - <strong>${maxYear}</strong></p>
      <p>Average CGC Grade: <strong>${avgCgcGrade}</strong> 
      (${cgcGrades.length.toLocaleString()} graded comics)</p>
    `;
    }
    showError(message) {
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            statsDiv.innerHTML = `<div class="error">${message}</div>`;
        }
    }
    setupQuickFilter() {
        const quickFilterInput = document.getElementById('quickFilter');
        if (quickFilterInput) {
            quickFilterInput.addEventListener('input', (event) => {
                const target = event.target;
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

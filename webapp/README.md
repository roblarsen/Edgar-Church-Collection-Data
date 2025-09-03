# Edgar Church Collection Webapp

A TypeScript-based web application for browsing and exploring the Edgar Church collection of Golden Age comic books using an interactive data grid.

## Features

- **Interactive Data Grid**: Browse through 14,728+ comic book records using ag-grid
- **Real-time Statistics**: View collection statistics including total records, unique publishers, and year range
- **Pagination**: Navigate through large datasets with 50 records per page
- **Sorting & Filtering**: Sort and filter by any column (Title, Issue #, Year, Publisher, Grades, etc.)
- **Responsive Design**: Clean, modern interface that works on different screen sizes
- **RESTful API**: Node.js/Express backend serving JSON data

## Data Fields

Each comic book record includes:
- **Title**: Comic book series name
- **Issue #**: Issue number
- **Year**: Publication year (1934-1966)
- **Publisher**: Publishing company (163 unique publishers)
- **MHC Grade**: Mile High Comics grade
- **CGC Grade**: Certified Guaranty Company grade
- **Page Quality**: Paper quality assessment
- **MHC Price**: Mile High Comics price
- **Note**: Additional notes
- **Comments**: Extra comments

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Navigate to the webapp directory:
   ```bash
   cd webapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build:all
   ```

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```
   
   The application will be available at: http://localhost:3000

2. **Development mode** (with auto-restart):
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /` - Main web application
- `GET /api/church-data` - JSON data endpoint returning all comic book records
- `GET /api/health` - Health check endpoint

### API Response Format

```json
{
  "success": true,
  "count": 14728,
  "data": [
    {
      "Title": "4 most",
      "Issue #": "2",
      "MHC Grade": "NM+",
      "MHC Price": "",
      "CGC Grade": "9.2",
      "Page Quality": "OW-W",
      "Note": "",
      "Year": "1942",
      "Publisher": "Novelty Press",
      "Comments": ""
    }
    // ... more records
  ]
}
```

## Technology Stack

- **Frontend**: TypeScript, HTML5, CSS3, ag-grid Community Edition
- **Backend**: Node.js, Express.js, TypeScript
- **Data Source**: JSON file generated from CSV data

## Project Structure

```
webapp/
├── src/
│   ├── server.ts       # Express server
│   └── app.ts          # Frontend TypeScript code
├── public/
│   ├── index.html      # Main HTML page
│   └── app.js          # Compiled frontend JavaScript
├── dist/
│   └── server.js       # Compiled server JavaScript
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Data Generation

The webapp serves data from `../dist/church-data-collection.json`. To regenerate this data:

1. Go to the root directory:
   ```bash
   cd ..
   ```

2. Run the Grunt build process:
   ```bash
   npm install
   npx grunt
   ```

This will process the CSV files in the `src/` directory and generate the JSON data file.

## Development

### Available Scripts

- `npm run build` - Compile TypeScript server code
- `npm run build:client` - Compile TypeScript client code  
- `npm run build:all` - Compile both server and client code
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build:all` to compile
3. Restart the server to see changes

## License

This data is licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

Please credit [Rob Larsen](http://itsalljustocomics.com/) with a link to ItsAllJustComics.com if you use this data.
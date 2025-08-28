module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      dist: {
        src: ['src/**'],
        dest: '.tmp/church-data-collection.csv'
      }
    },
    watch: {
      files: ['src/**'],
      tasks: ['concat']
    },
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /Title\,Issue\,MHC\sGrade\,MHC\sPrice\,CGC\sGrade\,Page\sQuality\,Note\,Year\,Publisher\,Comments/g,
              replacement: ''
            }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['.tmp/church-data-collection.csv'], dest:'dist/'}
        ]
      }
    },
    removeemptylines: {
      files: {
        '.tmp/church-data-collection.csv': ['.tmp/church-data-collection.csv']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-remove-empty-lines');
  grunt.loadNpmTasks('grunt-replace');

  // Custom task to convert CSV to JSON
  grunt.registerTask('csvtojson', 'Convert CSV data to JSON format', function() {
    var fs = require('fs');
    var path = require('path');
    
    var csvFile = 'dist/church-data-collection.csv';
    var jsonFile = 'dist/church-data-collection.json';
    
    if (!grunt.file.exists(csvFile)) {
      grunt.log.error('CSV file not found: ' + csvFile);
      return false;
    }
    
    var csvContent = grunt.file.read(csvFile);
    var lines = csvContent.split('\n').filter(function(line) {
      return line.trim() !== '';
    });
    
    if (lines.length < 2) {
      grunt.log.error('CSV file must have header and at least one data row');
      return false;
    }
    
    // Parse header
    var header = lines[0].split(',').map(function(col) {
      return col.trim();
    });
    
    // Parse data rows
    var data = [];
    for (var i = 1; i < lines.length; i++) {
      var values = lines[i].split(',');
      var record = {};
      
      for (var j = 0; j < header.length && j < values.length; j++) {
        var value = values[j] ? values[j].trim() : '';
        record[header[j]] = value;
      }
      
      data.push(record);
    }
    
    // Write JSON file
    grunt.file.write(jsonFile, JSON.stringify(data, null, 2));
    grunt.log.writeln('JSON file created: ' + jsonFile + ' (' + data.length + ' records)');
  });

  grunt.registerTask('default', ['concat','removeemptylines','replace','csvtojson']);

};

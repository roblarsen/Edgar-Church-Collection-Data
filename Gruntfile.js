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

  grunt.registerTask('default', ['concat','removeemptylines','replace']);

};

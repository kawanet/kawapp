/*! Gruntfile.js */

module.exports = function(grunt) {

  var pkg = require('./package.json');

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  var jshint_src = [
    './*.js',
    './*.json',
    'test/**/*.js'
  ];

  var watch_files = [
  ].concat(jshint_src);

  // Project configuration.
  grunt.initConfig({

    // https://github.com/gruntjs/grunt-contrib-watch
    watch: {
      all: {
        files: watch_files,
        tasks: ['default'],
        options: {
          interrupt: true
        }
      }
    },

    // https://github.com/gruntjs/grunt-contrib-jshint
    jshint: {
      all: {
        src: jshint_src
      },
      options: {
        node: true,
        undef: true, // W117: 'xxx' is not defined.
        globals: {
          describe: true, // mocha
          it: true
        },
        ignores: ["*.min.js"]
      }
    },

    // https://github.com/pghalliday/grunt-mocha-test
    mochaTest: {
      all: {
        src: ['test/**/*.test.js']
      },
      options: {
        reporter: 'spec'
      }
    },

    // https://github.com/gruntjs/grunt-contrib-uglify
    uglify: {
      production: {
        files: {
          'public/kawapp.min.js': ['kawapp.js']
        },
        options: {
          banner: '/*! ' + pkg.version + ' */\n'
        }
      }
    }
  });

  // grunt # デフォルトは jshint とテストだけ
  grunt.registerTask('default', ['jshint', 'mochaTest', 'uglify']);
};

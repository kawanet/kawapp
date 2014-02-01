/*! Gruntfile.js */

module.exports = function(grunt) {

  var pkg = require('./package.json');

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-quote-json');
  grunt.loadNpmTasks('grunt-jsdoc');

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
          'dist/kawapp.min.js': ['kawapp.js']
        },
        options: {
          banner: '/*! ' + pkg.name + ' ' + pkg.version + ' */\n'
        }
      }
    },

    // https://github.com/kawanet/grunt-quote-json
    quoteJson: {
      bower: {
        src: 'package.json',
        dest: 'bower.json',
        options: {
          fields: {
            name: 1,
            version: 1,
            description: 1,
            license: 1,
            repository: 1
          }
        }
      }
    },

    // https://github.com/krampstudio/grunt-jsdoc-plugin
    jsdoc: {
      all: {
        src: [pkg.main]
      },
      options: {
        destination: 'gh-pages/docs',
        "plugins": ["plugins/markdown"],
        "markdown": {
          "parser": "gfm"
        }
      }
    }
  });

  // grunt # デフォルトは jshint とテストだけ
  grunt.registerTask('default', ['jshint', 'quoteJson', 'uglify', 'mochaTest', 'jsdoc']);
};

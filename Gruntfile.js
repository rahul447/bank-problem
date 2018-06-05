module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    "babel": {
      "options": {
        "sourceMap": true,
        "presets": ["babel-preset-es2015"],
          "ignore": [
              "./lib/oldcontrollers/*.controller.js",
              "./lib/ElasticScript/*.*",
              "./lib/ElasticScript/*/*.*",
          ]
      },
      "dist": {
        "files": [{
            "expand": true,
            "cwd": "lib/",
            "src": ["**/*.router.js"],
            "dest": "dist/",
            "rename": function(dest, src) {
                return dest + src.replace('.js','.router.js');
            },
            "ext": ".js"
        }, {
          "expand": true,
          "cwd": "lib/",
          "src": ["**/*.model.js"],
          "dest": "dist/",
          "rename": function(dest, src) {
              return dest + src.replace('.js','.model.js');
          },
          "ext": ".js"
        }, {
            "expand": true,
            "cwd": "lib/",
            "src": ["**/*.controller.js"],
            "dest": "dist/",
            "rename": function(dest, src) {
                return dest + src.replace('.js','.controller.js');
            },
            "ext": ".js"
        }, {
            "expand": true,
            "cwd": "lib/",
            "src": ["**/*.js"],
            "dest": "dist/",
            "ext": ".js"
        }]
      }
    },
    "clean": [
      "dist/",
    ],
    "eslint": {
      "target": ["lib/**/*.js", "Gruntfile.js"],
      "options": {
        "configFile": ".eslintrc"
      }
    },
    "watch": {
      "es6": {
        "files": ["lib/**/*.js"],
        "tasks": ["babel:dist"]
      }
    },
      "copy": {
          "dist": {
              "files": [{
                  "expand": true,
                  "cwd": "lib/ElasticScript/",
                  "src": ["*.*", "**/*.*"],
                  "dest": "./dist/ElasticScript",
              }, /*{
                  "expand": true,
                  "cwd": "lib/TestBulkUploader/",
                  "src": ["*.*", "**!/!*.*"],
                  "dest": "./dist/TestBulkUploader",
                  "dot": true,
                  "force": true
              }*/]
          }
      },
      "exec": {
          "moveMammoth": {
              command: 'cp -R lib/endpoints/TestBulkUploader dist/endpoints',
              stdout: true,
              stderr: true
          }
      }
  });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-copy-force');
    grunt.loadNpmTasks('grunt-exec');

  // Default task.
  grunt.registerTask("default", [
    "buildCommon",
  ]);

  // Common build task
  grunt.registerTask("buildCommon", [
    "clean",
    "babel",
    "copy",
    //"eslint",
    "exec"
  ]);
};

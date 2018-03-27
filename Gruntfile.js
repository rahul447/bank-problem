module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    "babel": {
      "options": {
        "sourceMap": true,
        "presets": ["babel-preset-es2015"],
          "ignore": [
              "./lib/oldcontrollers/*.*"
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
      copy: {
          main: {
              files: [
                  // includes files within path
                  //{expand: true, src: ['lib/oldcontrollers/*'], dest: 'dist/oldcontrollers/'}
                  {
                      "expand": false,
                      "cwd": "lib/oldcontrollers",
                      "src": ["**/*.js"],
                      "dest": "dist/oldcontrollers",
                      "ext": ".js"
                  }
              ],
          },
      },
  });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task.
  grunt.registerTask("default", [
    "buildCommon",
  ]);

  // Common build task
  grunt.registerTask("buildCommon", [
    "clean",
    "babel",
    //"copy"
    //"eslint",
  ]);
};

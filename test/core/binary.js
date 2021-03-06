// These tests will only run on *nix operating systems

var should  = require('should');
var fs      = require('fs');
var os      = require('os');
var path    = require('path');
var exec    = require('child_process').exec;
var testDir = os.tmpdir() + path.sep + 'actionheroTestProject';
var binary  = './node_modules/.bin/actionhero';

var doBash = function(commands, callback){
  var fullCommand = '/bin/bash -c \'' + commands.join(' && ') + '\'';
  // console.log(fullCommand)
  exec(fullCommand, function(error, stdout, stderr){
    callback(error, stdout, stderr);
  });
};

describe('Core: Binary', function(){

  if(process.platform === 'win32'){
    console.log('*** CANNOT RUN BINARY TESTS ON WINDOWS.  Sorry. ***');
  }else{

    before(function(done){
      var sourcePackage = path.normalize(__dirname + '/../../bin/templates/package.json');
      var commands = [
        'rm -rf ' + testDir,
        'mkdir ' + testDir,
        'cp ' + sourcePackage + ' ' + testDir + '/package.json'
      ];
      doBash(commands, function(){
        var AHPath = path.normalize(__dirname + '/../..');
        fs.readFile(testDir + '/package.json', 'utf8', function(error, data){
          var result = data.replace(/%%versionNumber%%/g, 'file:' + AHPath);
          fs.writeFile(testDir + '/package.json', result, 'utf8', function(){
            done();
          });
        });
      });
    });

    afterEach(function(done){
      setTimeout(done, 500); // needed to allow Travis' disks to settle...
    });

    it('should have made the test dir', function(done){
      fs.existsSync(testDir).should.equal(true);
      fs.existsSync(testDir + '/package.json').should.equal(true);
      done();
    });

    it('can call npm install in the new project', function(done){
      this.timeout(1000 * 60);
      doBash([
        'cd ' + testDir,
        'npm install'
      ], function(error, data){
        should.not.exist(error);
        done();
      });
    });

    it('can generate a new project', function(done){
      doBash([
        'cd ' + testDir,
        binary + ' generate'
      ], function(error){
        should.not.exist(error);

        [
          'actions',
          'actions/showDocumentation.js',
          'actions/status.js',
          'config',
          'config/api.js',
          'config/errors.js',
          'config/i18n.js',
          'config/logger.js',
          'config/redis.js',
          'config/routes.js',
          'config/servers',
          'config/tasks.js',
          'config/servers/web.js',
          'config/servers/websocket.js',
          'config/servers/socket.js',
          'pids',
          'log',
          'public',
          'public/index.html',
          'public/chat.html',
          'public/css/actionhero.css',
          'public/javascript',
          'public/logo/actionhero.png',
          'public/logo/sky.jpg',
          'servers',
          'tasks',
          'test',
          'test/example.js',
        ].forEach(function(f){
          // console.log(f);
          fs.existsSync(testDir + '/' + f).should.equal(true);
        });

        done();
      });
    });

    it('can call the help command', function(done){
      doBash([
        'cd ' + testDir, binary + ' help'
      ], function(error, data){
        should.not.exist(error);
        data.should.containEql('actionhero start cluster');
        data.should.containEql('Binary options:');
        data.should.containEql('actionhero generate server');
        done();
      });
    });

    // TODO: Stdout from winston insn't comming though when program exists with error code
    it('will show a warning with bogus input');

    it('can generate an action', function(done){
      doBash([
        'cd ' + testDir,
        binary + ' generate action --name=myAction --description=my_description'
      ], function(error){
        should.not.exist(error);
        var data = String(fs.readFileSync(testDir + '/actions/myAction.js'));
        data.should.containEql('name:                   \'myAction\'');
        data.should.containEql('description:            \'my_description\'');
        data.should.containEql('next(error);');
        done();
      });
    });

    it('can generate a task', function(done){
      doBash([
        'cd ' + testDir,
        binary + ' generate task --name=myTask --description=my_description --queue=my_queue --frequency=12345'
      ], function(error){
        should.not.exist(error);
        var data = String(fs.readFileSync(testDir + '/tasks/myTask.js'));
        data.should.containEql('name:          \'myTask\'');
        data.should.containEql('description:   \'my_description\'');
        data.should.containEql('queue:         \'my_queue\'');
        data.should.containEql('frequency:     12345');
        data.should.containEql('next();');
        done();
      });
    });

    it('can generate a server', function(done){
      doBash([
        'cd ' + testDir,
        binary + ' generate server --name=myServer'
      ], function(error){
        should.not.exist(error);
        var data = String(fs.readFileSync(testDir + '/servers/myServer.js'));
        data.should.containEql('canChat: true');
        data.should.containEql('logConnections: true');
        data.should.containEql('logExits: true');
        data.should.containEql('sendWelcomeMessage: true');
        done();
      });
    });

    it('can generate a initializer', function(done){
      doBash([
        'cd ' + testDir,
        binary + ' generate initializer --name=myInitializer --stopPriority=123'
      ], function(error){
        should.not.exist(error);
        var data = String(fs.readFileSync(testDir + '/initializers/myInitializer.js'));
        data.should.containEql('loadPriority:  1000');
        data.should.containEql('startPriority: 1000');
        data.should.containEql('stopPriority:  123');
        data.should.containEql('initialize: function(api, next)');
        data.should.containEql('start: function(api, next)');
        data.should.containEql('stop: function(api, next)');
        done();
      });
    });

    describe('can run a single server', function(){
      it('can boot a single server');
      it('can handle signals to reboot');
      it('can handle signals to stop');
      it('will shutdown after the alloted time');
    });

    describe('can run a cluster', function(){
      it('can handle signals to reboot (graceful)');
      it('can handle signals to reboot (hup)');
      it('can handle signals to stop');
      it('can handle signals to add a worker');
      it('can handle signals to remove a worker');
      it('can detect flapping and exit');
      it('can reboot and abosrb code changes without downtime');
    });

  }
});

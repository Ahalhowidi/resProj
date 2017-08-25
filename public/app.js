(function() {

    var app = angular.module('app', ['ngRoute', 'angular-jwt']);

    app.run(function($rootScope, $location, $window, $http) {

        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $window.localStorage.token 

        $rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute) {
            if(nextRoute.access !== undefined && nextRoute.access.restricted === true  &&  !$window.localStorage.token) {
                event.preventDefault();
                $location.path('/');
            }
            if($window.localStorage.token && nextRoute.access.restricted === true) {
                
                $http.post('/api/verify-token', { token: $window.localStorage.token })
                     .then(function(response) {
                         console.log('your token is valid')
                     }, function(err) {
                         delete $window.localStorage.token;
                         $location.path('/login')
                     })
            }
        });
    })

    app.config(function($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

        $routeProvider.when('/main', {
            templateUrl: 'main.html',
            controller: 'MainController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/profile', {
            templateUrl: 'profile.html',
            controller: 'ProfileController',
            controllerAs: 'vm',
            access: {
                restricted: true
            }
        });
        $routeProvider.when('/register', {
            templateUrl: 'register.html',
            controller: 'RegisterController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/login', {
            templateUrl: 'login.html',
            controller: 'LoginController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        })
        $routeProvider.when('/Algorithm', {
            templateUrl: 'polls.html',
            controller: 'PollsController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/addAlg', {
            templateUrl: 'addAlg.html',
            controller: 'addAlgController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        });
        $routeProvider.when('/poll/:id', {
            templateUrl: 'poll.html',
            controller: 'PollController',
            controllerAs: 'vm',
            access: {
                restricted: false
            }
        })
        $routeProvider.otherwise('/Algorithm')

    })
    app.controller('MainController', MainController);
    
    function MainController( $window, jwtHelper) {
        var vm = this;
        vm.title = "MainController";
         vm.isLoggedIn = function() {
            if(!$window.localStorage.token) {
                return false;
            }
            if(jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();

        vm.logOut = function() {
            $window.localStorage.removeItem('token');
                 $location.path('/');
        }
    }

    app.controller('PollController', PollController);

    function PollController($http, $routeParams, $window, $location,jwtHelper) {
        var vm = this;
        vm.title = "PollController";
        vm.poll;
        vm.data;
        vm.link = 'https://fccvoting-hameed85.c9users.io/' + $location.path();
        vm.addOption = function() {
            if(vm.option) {
                $http.put('/api/polls/add-option', { option: vm.option, id: $routeParams.id }).then(function(response) {
                    vm.poll.push({
                        name: vm.option,
                        votes: 0
                    })
                    vm.option = null;
                    vm.getPoll();
                });
            }
        }


        vm.getPoll  = function() {
           
            var id = $routeParams.id;
             console.log(id);
            $http.get('/api/poll/' + id)
                 .then(function(response) {
                    
                    vm.id = response.data._id;
                    vm.owner = response.data.owner;
                    vm.name = response.data.name;
                    vm.poll = response.data.options;
                    vm.data = response.data;
                 }, function(err) {
                    $location.path('/polls');
                 })
        }
        vm.getPoll();

        function drawChart() {
        var chartArray = [];
        chartArray.push(['Name', 'Votes']);
        for(var i = 0; i < vm.data.options.length; i++){
            chartArray.push([vm.data.options[i].name, vm.data.options[i].votes ])
        }
        console.log(chartArray);
        var data = google.visualization.arrayToDataTable(chartArray);

        var options = {
          title: vm.data.name
        };

        var chart = new google.visualization.ColumnChart(document.getElementById('piechart'));

        chart.draw(data, options);
      }

      vm.vote = function(idpoll) {
          //var idpoll = $routeParams.id;
          console.log(idpoll);
          if(idpoll) {
              console.log('selkt')
              $http.put('/api/polls', { id: $routeParams.id, vote: idpoll  })
                   .then(function(response) {
                       vm.getPoll();
                   }, function(err) {
                       console.log(err)
                   })
          }
          else {
              console.log('No poll selected');
          }
      }
      vm.copy = function() {
         
            vm.lin= window.location.href;
            prompt('Press Ctrl + C, then Enter to copy to clipboard',vm.lin);
            console.log(vm.lin);

      }
      vm.isLoggedIn = function() {
            if(!$window.localStorage.token) {
                return false;
            }
            if(jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();
      

    }

    app.controller('PollsController', PollsController);

    function PollsController($http, $window, $location, jwtHelper) {
        var vm = this;
        vm.title = "PollsController";
        vm.polls = [];
        vm.poll = {
            name: '',
            options: [{
                name: '',
                votes: 1
            }]
        }
        vm.isLoggedIn = function() {
            if(!$window.localStorage.token) {
                return false;
            }
            if(jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();
       

        vm.getAllPolls = function() {
            $http.get('/api/polls').then(function(response) {
                vm.polls = response.data;
            });
        }
        vm.getAllPolls();

        vm.addPoll = function() {
            if(!$window.localStorage.token) {
                alert('Cannot create a poll without an account');
                return;
            }
            if(vm.poll) {
                var payload = {
                    owner: jwtHelper.decodeToken($window.localStorage.token).data.name || null,
                    name: vm.poll.name,
                    options: vm.poll.options,
                    token: $window.localStorage.token
                }
                $http.post('/api/polls' , payload).then(onSuccess, onError);
            }   
            else {
                console.log('No poll data supplied');
            }
        }
        vm.addOption = function() {
            vm.poll.options.push({
                name: '',
                votes: 1
            })
        }

        var onSuccess = function(response) {
            console.log(response.data)
            vm.poll = {};
            vm.getAllPolls();
        }
        var onError = function(err) {
            console.error(err)
        }
        vm.logOut = function() {
            $window.localStorage.removeItem('token');
                 $location.path('/');
        }

    }
app.controller('addAlgController', addAlgController);

    function addAlgController($http, $window, $location, jwtHelper) {
        var vm = this;
        vm.title = "addAlgController";
        vm.polls = [];
        vm.poll = {
            name: '',
            options: [{
                name: '',
                votes: 1
            }]
        }
        vm.isLoggedIn = function() {
            if(!$window.localStorage.token) {
                return false;
            }
            if(jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();
       

        vm.getAllPolls = function() {
            $http.get('/api/polls').then(function(response) {
                vm.polls = response.data;
            });
        }
        vm.getAllPolls();

        vm.addPoll = function() {
            if(!$window.localStorage.token) {
                alert('Cannot create a poll without an account');
                return;
            }
            if(vm.poll) {
                var payload = {
                    owner: jwtHelper.decodeToken($window.localStorage.token).data.name || null,
                    name: vm.poll.name,
                    options: vm.poll.options,
                    token: $window.localStorage.token
                }
                $http.post('/api/polls' , payload).then(onSuccess, onError);
            }   
            else {
                console.log('No poll data supplied');
            }
        }
        vm.addOption = function() {
            vm.poll.options.push({
                name: '',
                votes: 0
            })
        }

        var onSuccess = function(response) {
            console.log(response.data)
            vm.poll = {};
            vm.getAllPolls();
        }
        var onError = function(err) {
            console.error(err)
        }
        vm.logOut = function() {
            $window.localStorage.removeItem('token');
                 $location.path('/');
        }

    }
    
    app.controller('ProfileController', ProfileController);

    function ProfileController(jwtHelper, $window, $location, $http, $timeout) {
        var vm = this;
        vm.title = "ProfileController";
        vm.currentUser = null;
        vm.polls = [];
        var token = $window.localStorage.token;

        vm.getPollsByUser = function() {
            $http.get('/api/user-polls/'+ vm.currentUser.name)
                 .then(function(response) {
                     console.log(response);
                     vm.polls = response.data;
                 }, function(err) {
                     console.log(err)
                 })
        }

        vm.deletePoll = function(id) {
            if(id !== null) {
                $http.delete('/api/polls/' + id).then(function(response) {
                    vm.getPollsByUser();
                }, function(err) {
                    console.log(err)
                })
                     
            }
            else {
                return false;
            }
        }

        if(token) {
           vm.currentUser = jwtHelper.decodeToken(token).data;
           if(vm.currentUser !== null )  {
               vm.getPollsByUser();
           }
        }

        vm.logOut = function() {
            $window.localStorage.removeItem('token');
                 $location.path('/');
        }

    }

    app.controller('RegisterController', RegisterController);

    function RegisterController($location, $http, $window, $timeout) {
        var vm = this;
        vm.title = "RegisterController";
        vm.user = {
            email: '',
            name: '',
            gitAcount:'',
            password: ''
        }
        vm.register = function() {
            if(vm.user) {
                $http.post('/api/register', vm.user).then(onSuccess, onError);
                $timeout(function() {
                    vm.error = ''
                }, 5000)
            }
            else {
                $location.path('/register');
            }
        }

        var onSuccess = function(response) {
            $window.localStorage.token = response.data;
            $location.path('/polls');
        }

        var onError = function(err){
            if(err.data.code === 11000) {
                vm.error = "This user already exists";
            }
            vm.user = null;
            $location.path('/register');
        }

    }
    app.controller('LoginController', LoginController);

    function LoginController($http, $window, $location, $timeout) {
        var vm = this;
        vm.title = "LoginController";
        vm.user = {
            email: '',
            password: ''
        }
        vm.login = function() {
            if(vm.user) {
                
                $http.post('/api/login', vm.user).then(onSuccess, onError);
            }
            else {
                vm.user = null;
                $location.path('/login');
            }
        }

        var onSuccess = function(response) {
            $window.localStorage.token = response.data;
            $location.path('/polls');
        }
        var onError = function(error) {
            vm.error = "This user Not exists";
            $location.path('/login');
        }

        

    }

}());
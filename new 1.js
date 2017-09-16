// Created by Juan Danil
 

$(function(){
    console.log=function(){};
    //global variables
    var lat,
        lon,
        newLat,
        newLon, 
        city, 
        OWM_URL, 
        temp,
        humid,
        pressure,
        country,
        clouds,
        counter = 0;
        
    var $map = $("#map");
    var $spin = $(".spinner");
    var $show = $("#showMap");
    var $input = $("#input-city");
        
    
    //OpenWeatherMap API key
    var OWM_API_KEY = "f60e4a83f03cad255c90e70d343827fb";
    
    //Open this in browser https://cors-anywhere.herokuapp.com/ to see what it does
    OMW_URL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=" + OWM_API_KEY;

    //display current city on load, or at least city of your IP address provider
    currentCity();
    
    //Main function for city search
    searchCity();
    
    //Function to show google map, definition is at bottom
    toggleMap();
    
    //this is going to display a city of your IP address provider
    //it might be wrong ofcourse, in my case it's wrong by 500km. But then you can type in your desired city
    //I might include navigator.geolocation in future, but it's often not available in browsers, so for now it's this
    function currentCity(){
        $.getJSON("https://ipinfo.io", callback);
        
        function callback(data) {
            lat = data.loc.split(',')[0];
            lon = data.loc.split(',')[1];
    
            OWM_URL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=" + OWM_API_KEY;
            updateWeather(OWM_URL);
        }
    }
    
    //Gets city based on your input
    function yourCity() {
        
        var city = $input.val();
        var urlParam = "";
        
        //if input is invalid, it shows weather in my city :)
        if (!city) {
            city="Split";
            urlParam = "q="+city;
        }
        
        //regular expression to check whether input string contains any numbers
        //if it contains number, I assume that it is a ZIP code, and changed url parameter accordingly
        var regEx = city.match(/\d+/g);
        if (regEx !== null) {
            urlParam = "zip="+city;
        }
        else {
            urlParam = "q="+city;
        }
        
        OWM_URL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?"+urlParam+"&units=metric&appid=" + OWM_API_KEY;
        updateWeather(OWM_URL);
    }

    //main function for updating weather based on url which is generated based on city or current place
    function updateWeather(OWM_URL) {
        
        //weatherData will hold all requested data(typically object or array) in JSON format
        $.getJSON(OWM_URL, function(weatherData){

                //I uploaded icons in a way that their name ends with appropriate weather condition from API documentation
                //each weather condition has it's own short name, for example condition Clear sky has icon name 01d
                var icon = "https://dprogramming.000webhostapp.com/weather_photos/uelknvknjbbcbcdcbdjdcnun" + weatherData.weather[0].icon + ".PNG";
                
                //based on an icon name, apply appropriate background image
                $("body").css("background-image", "url(" + "https://dprogramming.000webhostapp.com/weather_photos/jnkfvnhuejcdferbvnd_" + weatherData.weather[0].icon + ".JPEG" + ")");
                
                city = weatherData.name;
                country = weatherData.sys.country;
                
                windDir = degToCompass(weatherData.wind.deg % 360);
                humid = weatherData.main.humidity;
                
                pressure = weatherData.main.pressure;
                clouds = weatherData.clouds.all;
                
                $(".city").html(city + ", " + country);
                $(".pressure").html(pressure + "hpa");
                $(".humid").html(humid + "%");
                $(".condition-icon").attr("src", icon);
                
                
                $(".weather-descr").html(firstLetterUpper(weatherData.weather[0].description) + "<br>(" + clouds + "% of clouds)");
                
                $(".container-fluid").fadeIn(800);
                $spin.hide();
                
                $(".compass").css({
                    "transform":"rotate(" + weatherData.wind.deg + "deg)",
                    "-webkit-transform":"rotate(" + weatherData.wind.deg + "deg)"
                });
                
                unitTrigger(weatherData);
                
                lat = weatherData.coord.lat;
                lon = weatherData.coord.lon;
                
                //after weather was updated with new latitude and longitude, set them to be equal to current ones
                newLat = lat;
                newLon = lon;
                
        }).fail(function(error) {
            
            //handle "404 not found" error, and show my city (usually happens when it's a wrong input)
            if (error.status == 404) {
                yourCity();
            }
            else {
                //if it's come other problem, show currentCity (shows unexpectedly)
                currentCity();
            }
        });
    }
    
    //every click on unit button increases counter and calls this function which converts data
    //if the counter is odd number units are imperial, else metric
    function updateUnits(weatherData) {
        
        temp = weatherData.main.temp;
        windSpeed = weatherData.wind.speed*3.6;
        
        if(counter % 2 == 1) {
            //unary + operator, converts operand to a number if it already isn't, this will also ditch any unnecessary zeros
            temp = +(temp * (9/5) + 32).toFixed(1) +"°F";
            windSpeed = +(windSpeed * 0.62137119223733).toFixed(2)+"mph";
            $("#change").val("°C");
        }
        else {
            temp = +temp.toFixed(1) +"°C";
            windSpeed = +windSpeed.toFixed(2)+"kph";
            $("#change").val("°F");
        }
        
        $(".temp").html(temp);
        
        //sometimes there isn't info about wind direction, if that happens I put N as a direction
        if(windDir) {
            $(".wind").html(windDir + " " + windSpeed);
        }
        else {
            $(".wind").html("N " + windSpeed);
        }
    }
    
    //function for updating weather data on every API call and updating units on every click
    function unitTrigger(data) {
        updateUnits(data);
        $("#change").off("click").on("click",function(){
            counter++;
            updateUnits(data);
        });
    }

    //turn degreess into wind direction name, StackOverflow thank you
    function degToCompass(num) {
        
        //Divide angle by 22.5 because 360/16 = 22.5deg per direction change
        //Add 0.5 so that when we divide the value we can break the 'tie' between the direction change threshold
        // 'tie' means, for example if its 11.25 degress we don't know if it's "N" or "NNE", because it's on the threshold
        var val = Math.floor((num / 22.5) + 0.5);
        
        //16 directions which are going clockwise starting from North
        var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        
        //Return the value from array at the index of (mod 16)
        return arr[(val % 16)];
    }
    
    //Monitors if the enter was pressed while typing in input field, if it's pressed, fire up click event on Go button
    function onEnterSearch() {
        $input.keyup(function(event) {
            if (event.keyCode == 13) {
                $("#submit").click();
            }
        });
    }
    
    //Main function for city search
    function searchCity() {
        onEnterSearch();
        
        $("#submit").off('click').on('click',function() {
            $(".container-fluid").fadeOut(200);
            $spin.show();
            yourCity();
            $input.val('').blur();
        });
    }
    
    
    //Weather description comes with first letter lowercase, I like it uppercase, so that's this
    function firstLetterUpper(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    //BELOW IS GOOGLE MAPS SECTION

    function googleMaps(lati, longi){
        
        window.google = {};
        
        //api url
        var GGL_URL = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDrd5FUzXQvUXYUrlzp3QiRLmR4utGsz1g&callback=?";
        var pos= {lat: lati, lng: longi};
        var map = null, marker = null;
        
        //send api request and set callback function
        $.getJSON(GGL_URL, initMap);
            
        //callback function for getJSON method, gets called after successful request
        function initMap(){
            
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 10,
                center: pos
            });
            
            marker = new google.maps.Marker({
                map: map,
                position: pos,
                draggable: true
            });
            
            //after marker was dragged to new position, save it's position in new variables
            google.maps.event.addListener(marker, 'dragend', function(ev){
                //get position of new marker
                newLat = marker.getPosition().lat(); // new Lat-Lon  after dragend-event
                newLon = marker.getPosition().lng();
            });
    
            //map won't get shown without this, because div was hidden and map acts the same without resize trigger, it's like an update
            google.maps.event.trigger(map, 'resize');
        }
    }
    
    //Function to show/hide a map on button click
    function toggleMap() {
        
        $show.click(function() {
            if($map.is(':visible')) {
                if(newLat != lat || newLon != lon) {
                    //update weather with new latitude and longitude
                    OWM_URL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?lat="+newLat+"&lon="+newLon+"&units=metric&appid=" + OWM_API_KEY;
                    updateWeather(OWM_URL);
                }
                $map.fadeOut();
                $show.val("⦿");
            }
            else {
                $spin.fadeIn(100);
                $map.fadeIn();
                googleMaps(lat, lon);
                $spin.fadeOut(100);
                $show.val("X");
            }
        });
    }
});

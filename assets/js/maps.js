var map, places, infoWindow;
var markers = [];
var autocomplete;
var countryRestrict = { 'country': 'uk' };
var hostnameRegexp = new RegExp('^https?://.+?/');

var countries = {
    'au': {
        center: { lat: -25.3, lng: 133.8 },
        zoom: 4
    },
    'br': {
        center: { lat: -14.2, lng: -51.9 },
        zoom: 3
    },
    'ca': {
        center: { lat: 62, lng: -110.0 },
        zoom: 3
    },
    'fr': {
        center: { lat: 46.2, lng: 2.2 },
        zoom: 5
    },
    'de': {
        center: { lat: 51.2, lng: 10.4 },
        zoom: 5
    },
    'mx': {
        center: { lat: 23.6, lng: -102.5 },
        zoom: 4
    },
    'nz': {
        center: { lat: -40.9, lng: 174.9 },
        zoom: 5
    },
    'it': {
        center: { lat: 41.9, lng: 12.6 },
        zoom: 5
    },
    'za': {
        center: { lat: -30.6, lng: 22.9 },
        zoom: 5
    },
    'es': {
        center: { lat: 40.5, lng: -3.7 },
        zoom: 5
    },
    'pt': {
        center: { lat: 39.4, lng: -8.2 },
        zoom: 6
    },
    'us': {
        center: { lat: 37.1, lng: -95.7 },
        zoom: 3
    },
    'uk': {
        center: { lat: 54.8, lng: -4.6 },
        zoom: 5
    }
};

//Function to render google map

function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: countries['uk'].zoom,
          center: countries['uk'].center,
          mapTypeControl: false,
          panControl: false,
          zoomControl: false,
          streetViewControl: false
        });

        infoWindow = new google.maps.InfoWindow({
          content: document.getElementById('info-content')
        });

        // Creates autocomplete object and associates it with the Search box controls
        // Restricts the search to the selected country and to place type "cities".

        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */ (
                document.getElementById('autocomplete')), {
              types: ['(cities)'],
              componentRestrictions: countryRestrict
            });
        places = new google.maps.places.PlacesService(map);

        autocomplete.addListener('place_changed', onPlaceChanged);

        // DOM event listener to react when the user selects a country.
        document.getElementById('country').addEventListener(
            'change', setAutocompleteCountry);
      }

       // Set the country restriction based on user input.
      // Also center and zoom the map on the given country.
      function setAutocompleteCountry() {
        var country = document.getElementById('country').value;
        if (country == 'all') {
          autocomplete.setComponentRestrictions({'country': []});
          map.setCenter({lat: 15, lng: 0});
          map.setZoom(2);
        } else {
          autocomplete.setComponentRestrictions({'country': country});
          map.setCenter(countries[country].center);
          map.setZoom(countries[country].zoom);
        }
        clearResults();
        clearMarkers();
        
      }






      // When the user selects a city, get the place details for the city and
      // zoom the map in on the city.
      function onPlaceChanged() {
        var place = autocomplete.getPlace();
        if (place.geometry) {
          map.panTo(place.geometry.location);
          map.setZoom(15);
          search();
        } else {
          document.getElementById('autocomplete').placeholder = 'Enter a city';
        }
      }

       // Search for hotels in the selected city, within the viewport of the map.
      function search() {
        var search = {
          bounds: map.getBounds(),
          types: ['lodging']
        };

        places.nearbySearch(search, function(results, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearResults();
            clearMarkers();

            // Iterate through serch results and add google default red marker
            // Add a number label to each marker

            for (var i = 0; i < results.length; i++) {
              
              // Use marker animation to drop the icons incrementally on the map.
                markers[i] = new google.maps.Marker({
                position: results[i].geometry.location,
                animation: google.maps.Animation.DROP,
                label:[i+1].toString()
              });
              // If the user clicks a hotel marker, show the details of that hotel
              // in an info window.
              markers[i].placeResult = results[i];
              google.maps.event.addListener(markers[i], 'click', showInfoWindow);
              setTimeout(dropMarker(i), i * 100);
              addResult(results[i], i);
            }
          }
        });
      }

      function clearMarkers() {
        for (var i = 0; i < markers.length; i++) {
          if (markers[i]) {
            markers[i].setMap(null);
          }
        }
        markers = [];
      }

     

      function dropMarker(i) {
        return function() {
          markers[i].setMap(map);
        };
      }

      //Populates results table with search results

    function addResult(result, i) {
        let resultCard = `
        <div class="result-list col col-md-9 mx-auto">
            <div class="card flex-md-row mb-2">
                <div class="card-body d-flex flex-column align-items-start">
                    <span class="result-number">${i+1}</span>
                    <h6 class="result-name mb-1">${result.name}</h6>
                    <span class="result-rating mb-1">${result.rating}  &#11088;</span>
                    <span class="result-address mb-1">${result.vicinity}</span>
                </div>
                <img class="result-img card-img-right d-md-block p-2 flex-auto" alt="Thumbnail [200x250]" src="${result.photos[0].getUrl()}" style="width: 150px; height: 150px;">
             </div>
        </div>
        `;
            document.getElementById('results').innerHTML += resultCard;
            document.getElementById('results').style.display = 'block';
    }

        
        

       
        tr.onclick = function() {
          google.maps.event.trigger(markers[i], 'click');
        };

        

      function clearResults() {
        var results = document.getElementById('results');
        while (results.childNodes[0]) {
          results.removeChild(results.childNodes[0]);
        }
      }

      // Get the place details for a hotel. Show the information in an info window,
      // anchored on the marker for the hotel that the user selected.
      function showInfoWindow() {
        var marker = this;
        places.getDetails({placeId: marker.placeResult.place_id},
            function(place, status) {
              if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
              }
              infoWindow.open(map, marker);
              buildIWContent(place);
            });
      }

      // Load the place information into the HTML elements used by the info window.
      function buildIWContent(place) {
        document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' +
            'src="' + place.icon + '"/>';
        document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
            '">' + place.name + '</a></b>';
        document.getElementById('iw-address').textContent = place.vicinity;

        if (place.formatted_phone_number) {
          document.getElementById('iw-phone-row').style.display = '';
          document.getElementById('iw-phone').textContent =
              place.formatted_phone_number;
        } else {
          document.getElementById('iw-phone-row').style.display = 'none';
        }

        // Assign a five-star rating to the hotel, using a black star ('&#10029;')
        // to indicate the rating the hotel has earned, and a white star ('&#10025;')
        // for the rating points not achieved.
        if (place.rating) {
          var ratingHtml = '';
          for (var i = 0; i < 5; i++) {
            if (place.rating < (i + 0.5)) {
              ratingHtml += '&#10025;';
            } else {
              ratingHtml += '&#10029;';
            }
          document.getElementById('iw-rating-row').style.display = '';
          document.getElementById('iw-rating').innerHTML = ratingHtml;
          }
        } else {
          document.getElementById('iw-rating-row').style.display = 'none';
        }

        // The regexp isolates the first part of the URL (domain plus subdomain)
        // to give a short URL for displaying in the info window.
        if (place.website) {
          var fullUrl = place.website;
          var website = hostnameRegexp.exec(place.website);
          if (website === null) {
            website = 'http://' + place.website + '/';
            fullUrl = website;
          }
          document.getElementById('iw-website-row').style.display = '';
          document.getElementById('iw-website').textContent = website;
        } else {
          document.getElementById('iw-website-row').style.display = 'none';
        }
      }
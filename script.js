"use strict";

// mj2gd@freesourcecodes.com

const API_KEY = "23e9c0c9b8e88420ea8bfa821bb9c474";
const API_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const API_GEOCODING_URL = "http://api.openweathermap.org/geo/1.0/direct?q="

const searchInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const matchList = document.getElementById("match-list");
const cityElement = document.getElementById("city-name");
const temperatureElement = document.getElementById("temperature");
const descriptionElement = document.getElementById("description");

let debounceTimer;
let startTime;
let worldCities;
let city_lat;
let city_lng;

let fetchStartTime = performance.now();
fetch("filtered-formatted.json.gz")
    .then(response => {
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Compressed cities loaded!");
        
        let decompressStartTime = performance.now();

        const decompressionStream = new DecompressionStream("gzip");
        const decompressedStream = response.body.pipeThrough(decompressionStream);
        
        return new Response(decompressedStream).text().then(text => {
            console.log(`Decompressing ended in ${performance.now() - decompressStartTime}`);
            return JSON.parse(text);
        });
    })
    .then(cities => {
        console.log(`Fetch ended in ${performance.now() - fetchStartTime}`);
        worldCities = cities;
        console.log(worldCities[0]);
    })
    .catch(error => {
        console.error("Error fetching city data:", error);
    });

searchInput.addEventListener("input", () => {
    startTime = performance.now();
    // console.log("Input triggered!");
    clearTimeout(debounceTimer); // скинути попередній таймер!

    debounceTimer = setTimeout(() => {
        const searchText = searchInput.value.trim();
        if (searchText.length > 0) {
            let matches = searchCities(worldCities, searchText);
            outputHtml(matches);
        } else {
            matchList.innerHTML = "";
        }
    }, 300); // пауза - 300 мс
});

//START 2!

const searchCities = (cities, cityName) => {
    let matches = cities.filter(entry =>
        entry.city.toLowerCase().startsWith(cityName.toLowerCase()) || entry.city_ascii.toLowerCase().startsWith(cityName.toLowerCase()) 
    );

    console.log(matches);

    if (cityName.length === 0) {
        matches = [];
    }

    return matches;
}

const outputHtml = matches => {
    if (matches.length > 0) {
        const html = matches.map(match => `<li class="dropdown-item" lat=${match.lat} lng=${match.lng}>${match.city}, ${match.country}</li>`).join("");

        matchList.innerHTML = html;

        const items = document.querySelectorAll(".dropdown-item");
        items.forEach(item => {
            item.addEventListener("click", () => {
                city_lat = item.getAttribute("lat");
                city_lng = item.getAttribute("lng");
                console.log(`LOCATION: ${city_lat}, ${city_lng}`);
                searchInput.value = item.textContent;
                matchList.innerHTML = "";
                searchButton.click();
            });
        });
        console.log(`Search took ${performance.now() - startTime} milliseconds`);
    } else {
        matchList.innerHTML = "";
    }
};

searchButton.addEventListener("click", () => {
    const location = searchInput.value;
    if (location) {
        fetchWeather(location);
        matchList.innerHTML = "";
    }``
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
        matchList.innerHTML = "";
    }
});


function fetchWeather(location) {
    const weatherUrl = `${API_WEATHER_URL}?lat=${city_lat}&lon=${city_lng}&appid=${API_KEY}&units=metric&lang=pl`;
    // console.log(URL: ${weatherUrl});
    fetch(weatherUrl)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        cityElement.textContent = data.name;
        temperatureElement.textContent = `${Math.round(data.main.temp)} °C`;
        descriptionElement.textContent = data.weather[0].description;
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
    });
}

// START 
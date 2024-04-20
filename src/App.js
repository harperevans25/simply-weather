import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, ButtonGroup, Spinner, Modal } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChatRight, Crosshair, Wind, X, GeoAltFill } from 'react-bootstrap-icons';
import Cookies from 'js-cookie';
import city_json from "./city_json.json";

function App() {

  const [location, setLocation] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState(null);
  const [gridX, setGridX] = useState(null);
  const [gridY, setGridY] = useState(null);
  const [gridId, setGridId] = useState(null);
  const [selectedHourlyForecast, setSelectedHourlyForecast] = useState(null);

  const [token, setToken] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Load token from cookie on component mount
  useEffect(() => {
    const savedToken = Cookies.get('googlePlacesToken');
    if (savedToken) {
      setToken(savedToken);
    }
    else {
      setShowModal(true);
    }
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <LocationUpdater location={location} setLocation={setLocation} setHourlyWeather={setHourlyWeather} />
      </header>
      <div className='app-body'>
        {(hourlyWeather === null) ? (
          <Spinner style={{ color: '#1147ee', width: '100px', height: '100px' }} />
        ) : (
          <>
            <div className='daily-view-super-wrapper'>
              <DailyView
                hourlyWeather={hourlyWeather}
                setSelectedHourlyForecast={setSelectedHourlyForecast}
                selectedHourlyForecast={selectedHourlyForecast}
              />
            </div>
            <div className='hourly-view-wrapper'>
              <HourlyView
                hourlyWeather={hourlyWeather}
                selectedHourlyForecast={selectedHourlyForecast}
              />
            </div>
          </>

        )}
      </div>
      <DataApi
        location={location}
        gridX={gridX}
        setGridX={setGridX}
        gridY={gridY}
        setGridY={setGridY}
        gridId={gridId}
        setGridId={setGridId}
        setHourlyWeather={setHourlyWeather}
      />
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>APP NOTICE</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>No Google Places API Key found, please go to settings and put one in or the app may not work as expected.</p>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;

const SettingsView = () => {
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState('');

  // Load token from cookie on component mount
  useEffect(() => {
    const savedToken = Cookies.get('googlePlacesToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleTokenChange = (e) => {
    Cookies.set('googlePlacesToken', e.target.value);
    setToken(e.target.value);
  };

  return (
    <>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        Open Settings
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="custom-modal-header">
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: 'flex', gap: '5px', lineHeight: 1, alignItems: 'center' }}>
            <label htmlFor="tokenInput">Google Places API Token:</label>
            <input
              id="tokenInput"
              type="text"
              value={token}
              onChange={handleTokenChange}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

const LocationUpdater = ({ location, setLocation, setHourlyWeather }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null); // Use useRef instead of useState for inputRef
  const [loading, setLoading] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);
  const [cityData, setCityData] = useState(null);
  const [topResults, setTopResults] = useState([]);
  const scriptLoading = useRef(false);

  useEffect(() => {
    updateLocation();
    const fetchData = async () => {
      try {
        // const response = await fetch('/city_json.json'); // Adjust the path accordingly
        const data = city_json;
        setCityData(data.places);
      } catch (error) {
        console.error('Error fetching city file:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (inputValue !== '' && cityData) {
      // Filter the city data based on the user input
      const filteredCities = cityData.filter(city => city.name.toLowerCase().startsWith(inputValue.toLowerCase()));

      // Assuming you want to get the top 5 results
      const results = filteredCities.slice(0, 5).map(city => ({ name: city.name, coordinates: city.coordinates }));

      // Update topResults state
      setTopResults(results);
      if (results.length > 0) {
        if (results[0].name.toLowerCase() === inputValue.toLowerCase()) {
          setTopResults([]);
          setLocation({ 'latitude': results[0].coordinates.lat, 'longitude': results[0].coordinates.lon });
        }
      } else {
        // Clear topResults if inputValue is empty
        setTopResults([]);
      }
    }
  }, [inputValue, cityData]);

  const updateLocation = () => {
    setTopResults([]);
    setLoading(true);
    setLocation(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInputValue('');
          inputRef.current.placeholder = 'Using Current Location'; // Set placeholder
          setLoading(false);
          setLocation({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Unknown error occurred.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for Geolocation.';
              setLocationServicesEnabled(false);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              setLocationServicesEnabled(false);
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = 'An unknown error occurred.';
              break;
            default:
              errorMessage = 'An error occurred while getting the location.';
              break;
          }
          console.error('Error getting location:', errorMessage);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLocationServicesEnabled(false);
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleResultClick = (selectedCity) => {
    setInputValue(selectedCity.name);
    setLocation({ 'latitude': selectedCity.coordinates.lat, 'longitude': selectedCity.coordinates.lon });
    setTopResults([]); // Clear topResults after selecting a city
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        className="search-input"
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
      />
      {topResults.length > 0 && (
        <div className="search-results">
          {topResults.map((city, index) => (
            <div
              key={index}
              className="search-result"
              onClick={() => handleResultClick(city)}
            >
              {city.name}
            </div>
          ))}
        </div>
      )}
      {locationServicesEnabled ? (
        loading ? (
          <Spinner className='search-spinner' />
        ) : (
          <button className="search-button" onClick={updateLocation}>
            <Crosshair size={25} className="search-icon" />
          </button>
        )
      ) : (
        <LocationOff size={30} />
      )}
    </div>
  );
};

const OldLocationUpdater = ({ location, setLocation, setHourlyWeather }) => {
  const inputRef = useRef({});
  const [loading, setLoading] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);
  const scriptLoading = useRef(false);

  useEffect(() => {
    updateLocation();
    const loadGoogleMapsScript = () => {
      // Check if Google Maps API script is already loaded
      if (window.google && window.google.maps) {
        //console.log('Google Maps API already loaded');
        initializeAutocomplete();
      } else {
        if (!scriptLoading.current) {
          scriptLoading.current = true;
          //console.log('Loading Google Maps API...');
          const script = document.createElement('script');
          const apiKey = Cookies.get('googlePlacesToken'); // Replace with your actual API key
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.onload = () => {
            initializeAutocomplete();
          };
          script.onerror = () => {
            scriptLoading.current = false;
            console.error('Error loading Google Maps API script.');
          };
          document.body.appendChild(script);

          return () => {
            document.body.removeChild(script);
          };
        }
      }
    };

    loadGoogleMapsScript();
  }, []);

  const initializeAutocomplete = () => {
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'], // Restrict to cities
      componentRestrictions: { country: 'US' } // Restrict to United States
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.error('No location data available for input:', inputRef.current.value);
        return;
      }
      setHourlyWeather(null);
      const { lat, lng } = place.geometry.location;
      setLocation({ latitude: lat(), longitude: lng() });
    });
  };

  const updateLocation = () => {
    setLoading(true);
    setLocation(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          inputRef.current.value = '';
          inputRef.current.placeholder = 'Using Current Location';
          setLoading(false);
          setLocation({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Unknown error occurred.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for Geolocation.';
              setLocationServicesEnabled(false);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              setLocationServicesEnabled(false);
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = 'An unknown error occurred.';
              break;
            default:
              errorMessage = 'An error occurred while getting the location.';
              break;
          }
          console.error('Error getting location:', errorMessage);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLocationServicesEnabled(false);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        className="search-input"
        ref={inputRef}
      />
      {locationServicesEnabled ? (
        loading ? (
          <Spinner className='search-spinner' />
        ) : (
          <button className="search-button" onClick={updateLocation}>
            <Crosshair size={25} className="search-icon" />
          </button>
        )
      ) : (
        <LocationOff size={30} />
      )}
    </div>
  );
};

const LocationOff = ({ size }) => {
  return (
    <div style={{ position: 'absolute', display: 'inline-block', right: '10px', top: '8px' }}>
      <GeoAltFill size={size} style={{ position: 'relative', zIndex: 1 }} />
      <X size={size * 1.75} style={{ position: 'absolute', top: "-40%", left: "-35%", zIndex: 2, color: '#FF0000' }} />
    </div>
  );
}

const DataApi = ({
  location,
  gridX,
  gridY,
  setGridX,
  setGridY,
  setGridId,
  setHourlyWeather
}) => {

  async function fetchData(url) {
    try {
      const response = await axios.get(url);
      // Handle the response data
      return response.data; // Return the response data
    } catch (error) {
      // Handle any errors
      console.error('Error fetching data:', error);
      throw error; // Re-throw the error to be handled by the caller if needed
    }
  }

  function groupDataByDay(dataArray) {
    // Create an empty object to store grouped data
    let groupedData = {};

    // Loop through each item in the dataArray
    dataArray.forEach(item => {
      // Get the date of the item
      let date = item.startTime.split('T')[0]; // Assuming datetime is in ISO8601 format
      // If the date is not already a key in groupedData, initialize it with an empty array
      if (!groupedData[date]) {
        groupedData[date] = [];
      }

      // Push the item to the array corresponding to its date
      groupedData[date].push(item);
    });

    // Convert groupedData object into the required format
    let result = [];
    for (let date in groupedData) {
      result.push({ 'date': date, 'hourly_data': groupedData[date] });
    }

    return result;
  }

  useEffect(() => {
    const fetchDataAsync = async () => {
      if (location) {
        try {
          const weatherLocationMetaData = await fetchData(`https://api.weather.gov/points/${location.latitude},${location.longitude}`);
          if (weatherLocationMetaData.properties.gridX !== gridX || weatherLocationMetaData.properties.gridY !== gridY) {
            setGridId(weatherLocationMetaData.properties.gridId);
            setGridX(weatherLocationMetaData.properties.gridX);
            setGridY(weatherLocationMetaData.properties.gridY);
            const weatherLocationHourly = await fetchData(weatherLocationMetaData.properties.forecastHourly);
            setHourlyWeather(groupDataByDay(weatherLocationHourly.properties.periods));
          }

          // Set your state for daily and hourly weather here using setDailyWeather and setHourlyWeather
        } catch (error) {
          // Handle error if needed
        }
      }
    };

    fetchDataAsync();
  }, [location, setGridId, setGridX, setGridY]);

  return null; // Adjust the return value as per your component structure
}

const HourlyView = ({ hourlyWeather, selectedHourlyForecast }) => {
  return (
    <>

      {hourlyWeather && selectedHourlyForecast !== null && (
        <>
          <HourlyDataEntryHeader list={['Time', 'Temp (F)', 'Rain', 'Wind', 'Humidity']} />
          <AnimatedHourlyWeatherList hourlyWeather={hourlyWeather} selectedHourlyForecast={selectedHourlyForecast} />
          {/* {hourlyWeather[selectedHourlyForecast].hourly_data.map((item, index) => (
            // Render your content here for each item in hourlyWeather[selectedHourlyForecast]
            <div key={index} className='hourly-data-entry-wrapper'>
              <HourlyDataEntry entry={item} />
              <div className='divider' />
            </div>
          ))} */}
        </>
      )}
    </>
  )
}

const HourlyDataEntry = ({ entry, style, extraClass }) => {
  return (
    <div className={`hourly-entry-wrapper ${extraClass}`} style={{ ...style }}>
      <span className='hourly-entry-wrapper-span'>
        {String(new Date(entry.startTime).getHours()).padStart(2, '0')}
        :
        {String(new Date(entry.startTime).getMinutes()).padStart(2, '0')}
      </span>
      <span className='hourly-entry-wrapper-span'>{entry.temperature}°</span>
      <span className='hourly-entry-wrapper-span'>{entry.probabilityOfPrecipitation.value}%</span>
      <span className='hourly-entry-wrapper-span'>{parseInt(entry.windSpeed)} MPH {entry.windDirection}</span>
      <span className='hourly-entry-wrapper-span'>{entry.relativeHumidity.value}%</span>
    </div>
  )
}

const HourlyDataEntryHeader = ({ list }) => {
  return (
    <div className='hourly-data-entry-wrapper'>
      <div className='hourly-entry-wrapper'>
        {list.map((entry, index) => (
          <span key={index} className='hourly-entry-wrapper-span'>
            {entry}
          </span>
        ))}
      </div>
      <div className='divider' style={{ height: 4 }} />
    </div>
  );
}

const DailyView = ({ hourlyWeather, setSelectedHourlyForecast, selectedHourlyForecast }) => {
  return (
    <AnimatedDailyWeatherList hourlyWeather={hourlyWeather} setSelectedHourlyForecast={setSelectedHourlyForecast} selectedHourlyForecast={selectedHourlyForecast} />
  );
}

const AnimatedDailyWeatherList = ({ hourlyWeather, setSelectedHourlyForecast, selectedHourlyForecast }) => {
  const [visibleCards, setVisibleCards] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (hourlyWeather && hourlyWeather.length > 0) {
      const timer = setTimeout(() => {
        setVisibleCards(hourlyWeather);
      }, 200); // Adjust the delay between each card

      return () => clearTimeout(timer);
    }
  }, [hourlyWeather]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleScroll = (event) => {
    if (isHovered) {
      //event.preventDefault();
      const scrollAmount = event.deltaY;
      event.currentTarget.scrollLeft += scrollAmount;
    }
  };

  return (
    <div
      className="daily-view-wrapper"
      style={{ overflowY: 'hidden', overflowX: 'scroll', overscrollBehavior: 'contain' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleScroll}
    >
      {visibleCards.map((weatherItem, index) => {
        const animationDuration = 0.5;
        const animationDelay = 0.2;
        const animationName = `slideInFromRight`;
        const animCard = (i) => `${animationName} ${animationDuration}s ease-in-out ${animationDelay * i}s forwards`;
        return (
          <DailyWeatherCard
            key={index}
            dailyWeatherData={weatherItem}
            setSelectedHourlyForecast={setSelectedHourlyForecast}
            selectedHourlyForecast={selectedHourlyForecast}
            index={index}
            style={{
              animation: animCard(index)
            }}
          />
        );
      })}
    </div>
  );
};

const AnimatedHourlyWeatherList = ({ hourlyWeather, selectedHourlyForecast }) => {
  const [visibleCards, setVisibleCards] = useState([]);
  let animationDelay = 0.025;
  const isManagingCards = useRef(false);

  useEffect(() => {
    if (hourlyWeather && hourlyWeather.length > 0) {
      if (isManagingCards.current) {
        return;
      }

      const removeAndAddCards = async () => {
        isManagingCards.current = true;

        // Fade out the existing cards
        for (let index = visibleCards.length - 1; index >= 0; index--) {
          await new Promise(resolve => {
            setTimeout(() => {
              setVisibleCards(prevCards => {
                const updatedCards = [...prevCards];
                updatedCards[index].opacity = 0;
                return updatedCards;
              });
              resolve();
            }, animationDelay / 2 * 1000); // Convert to milliseconds
          });

          // Remove the card from the array after animation is complete
          setVisibleCards(prevCards => {
            const updatedCards = [...prevCards];
            updatedCards.splice(index, 1);
            return updatedCards;
          });
        }

        // After all cards are removed, add new cards
        const newCards = hourlyWeather[selectedHourlyForecast].hourly_data.map(card => ({ ...card, opacity: 0 }));
        setVisibleCards(newCards);

        // Fade in the new cards one at a time
        for (let index = 0; index < newCards.length; index++) {
          await new Promise(resolve => {
            setTimeout(() => {
              setVisibleCards(prevCards => {
                const updatedCards = [...prevCards];
                updatedCards[index].opacity = 1; // Assuming you're using CSS transitions for opacity change
                return updatedCards;
              });
              resolve();
            }, animationDelay * 1000); // Convert to milliseconds
          });
        }
        isManagingCards.current = false;
      };

      removeAndAddCards();
    }
  }, [selectedHourlyForecast]);

  return (
    <div className="hourly-entry-wrapper hourly-data-entry-wrapper">
      {visibleCards.map((card, index) => (

        <HourlyDataEntry
          entry={card}
          key={index}
          extraClass={`hourly-card ${card.opacity === 1 ? 'visible' : 'hidden'} `}
        />
      ))}
    </div>
  );
};

function getFormattedTimeOffset() {
  // Convert offset from minutes to hours and minutes
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMinutesRemainder = Math.abs(offsetMinutes) % 60;

  // Construct the time offset string
  const offsetString = `${offsetMinutes < 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutesRemainder.toString().padStart(2, '0')}`;

  return `T00:00:00${offsetString}`;
}

const DailyWeatherCard = ({ dailyWeatherData, index, style, setSelectedHourlyForecast, selectedHourlyForecast }) => {

  const averageTemp = parseInt(dailyWeatherData.hourly_data.reduce((acc, hour) => acc + hour.temperature, 0) / dailyWeatherData.hourly_data.length);
  const lowTemp = dailyWeatherData.hourly_data.reduce((min, hour) => Math.min(min, hour.temperature), Infinity);
  const highTemp = dailyWeatherData.hourly_data.reduce((max, hour) => Math.max(max, hour.temperature), -Infinity);
  const averageHumidity = parseInt(dailyWeatherData.hourly_data.reduce((acc, hour) => acc + hour.relativeHumidity.value, 0) / dailyWeatherData.hourly_data.length);
  const averageWind = parseInt(dailyWeatherData.hourly_data.reduce((acc, hour) => acc + parseInt(hour.windSpeed), 0) / dailyWeatherData.hourly_data.length);
  const averagePrecipitation = parseInt(dailyWeatherData.hourly_data.reduce((acc, hour) => acc + hour.probabilityOfPrecipitation.value, 0) / dailyWeatherData.hourly_data.length);

  const setSelectedIndex = (index) => {
    if (index !== selectedHourlyForecast) {
      setSelectedHourlyForecast(index);
    }
  }

  return (
    <div key={index} className='weather-card' style={{ ...style }} onClick={() => setSelectedIndex(index)}>
      <div className='daily-temperature-wrapper'>
        <span className='daily-temperature-wrapper-main-temp'>
          {averageTemp}°
        </span>
        <span className='daily-temperature-wrapper-extreme-temp'>
          {lowTemp}° - {highTemp}°
        </span>
      </div>
      <div className='daily-wind-wrapper'>
        <span>Wind Speed: {averageWind} MPH</span>
      </div>
      <div className='daily-humidity-wrapper'>
        Humidity: {averageHumidity}%
      </div>
      <div className='daily-svg-wrapper'>
        <svg width="150" height="150" viewBox="50 50 150 150">
          <image xlinkHref={averagePrecipitation > 90 ? 'weather_svgs/thunder.svg' :
            averagePrecipitation > 75 ? 'weather_svgs/rainy-6.svg' :
              averagePrecipitation > 60 ? 'weather_svgs/rainy-5.svg' :
                averagePrecipitation > 45 ? 'weather_svgs/rainy-4.svg' :
                  averagePrecipitation > 30 ? 'weather_svgs/rainy-2.svg' :
                    averagePrecipitation > 15 ? 'weather_svgs/cloudy.svg' :
                      'weather_svgs/clear_day.svg'}
            width="250" height="250" style={{ overflow: 'visible' }} />
        </svg>
        <span>{averagePrecipitation}%</span>
      </div>
      <div className='daily-date-wrapper'>
        {new Date(dailyWeatherData.date + getFormattedTimeOffset()).toLocaleString('en-US', { month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}
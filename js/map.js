/**
 * Transit Map Application
 * Dynamic GTFS-powered interactive map
 */

class TransitMapApp {
    constructor() {
        this.gtfsParser = new GTFSParser('./gtfs/');
        this.map = null;
        this.layers = {
            routes: [],
            stops: []
        };
        this.data = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading screen
            this.showLoading('Cargando datos GTFS...');

            // Load GTFS data
            this.data = await this.gtfsParser.loadAll();
            
            if (!this.data) {
                throw new Error('Failed to load GTFS data');
            }

            // Initialize map
            this.initMap();

            // Render map layers
            this.renderRoutes();
            this.renderStops();

            // Render sidebar
            this.renderSidebar();

            // Hide loading screen
            this.hideLoading();

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al cargar los datos. Por favor, recarga la página.');
        }
    }

    /**
     * Initialize Leaflet map
     */
    initMap() {
        // Create map centered on route
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([19.59, -99.12], 11);

        // Define base layers
        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        });

        // Satellite layer with labels (Esri)
        const satelliteLayer = L.layerGroup([
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }),
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                attribution: '',
                maxZoom: 19
            })
        ]);

        // Add default layer (dark)
        darkLayer.addTo(this.map);

        // Create layer control
        const baseMaps = {
            "🌙 Mapa Oscuro": darkLayer,
            "🛰️ Vista Satélite": satelliteLayer
        };

        L.control.layers(baseMaps, null, {
            position: 'topright',
            collapsed: false
        }).addTo(this.map);

        // Add scale control
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(this.map);
    }

    /**
     * Render route lines on map
     */
    renderRoutes() {
        const shapes = this.gtfsParser.getRouteShapes();
        const routes = this.gtfsParser.getRoutes();
        
        Object.keys(shapes).forEach(shapeId => {
            const coords = shapes[shapeId].map(point => [point.lat, point.lon]);
            const route = routes[0]; // Assuming single route
            
            const line = L.polyline(coords, {
                color: route.color,
                weight: 5,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(this.map);

            this.layers.routes.push(line);
        });

        // Fit map to route bounds
        if (this.layers.routes.length > 0) {
            const group = L.featureGroup(this.layers.routes);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Get next train times for a station
     */
    getNextTrains(stopIndex) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        const calendar = this.gtfsParser.getCalendar();
        const frequencies = this.gtfsParser.getFrequencies();
        const stopTimes = this.data.stopTimes;
        
        if (!calendar.length || !frequencies.length || !stopTimes) {
            return null;
        }

        // Determine service type
        let serviceType = '';
        if (dayOfWeek === 0) {
            serviceType = 'sunday';
        } else if (dayOfWeek === 6) {
            serviceType = 'saturday';
        } else {
            serviceType = 'weekday';
        }

        // Get frequencies for this service
        const relevantFreqs = frequencies.filter(f => f.tripId.includes(serviceType));
        
        if (!relevantFreqs.length) return null;

        const nextTrains = [];

        relevantFreqs.forEach(freq => {
            // Parse start and end times
            const [startH, startM] = freq.startTime.split(':').map(Number);
            const [endH, endM] = freq.endTime.split(':').map(Number);
            
            let startMinutes = startH * 60 + startM;
            let endMinutes = endH === 24 ? 24 * 60 : endH * 60 + endM;
            
            // Get the stop time offset for this station
            const stopId = this.gtfsParser.getStops()[stopIndex].id;
            const relevantStopTime = stopTimes.find(st => 
                st.trip_id === freq.tripId && st.stop_id === stopId
            );

            if (!relevantStopTime) return;

            // Calculate offset from trip start
            const [arrivalH, arrivalM, arrivalS] = relevantStopTime.arrival_time.split(':').map(Number);
            const offsetMinutes = (arrivalH * 60 + arrivalM) - startMinutes;

            // Calculate next departure times
            const headwayMin = Math.floor(freq.headwaySecs / 60);
            let departureTime = startMinutes;

            while (departureTime < endMinutes) {
                const adjustedTime = departureTime + offsetMinutes;
                
                if (adjustedTime >= currentTime) {
                    const hours = Math.floor(adjustedTime / 60) % 24;
                    const minutes = adjustedTime % 60;
                    const minutesUntil = adjustedTime - currentTime;
                    
                    const direction = freq.tripId.includes('_0') ? 'hacia AIFA' : 'hacia Buenavista';
                    
                    nextTrains.push({
                        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                        minutesUntil,
                        direction
                    });

                    if (nextTrains.length >= 3) break;
                }
                
                departureTime += headwayMin;
            }
        });

        // Sort by time and return first 2
        return nextTrains.sort((a, b) => a.minutesUntil - b.minutesUntil).slice(0, 2);
    }

    /**
     * Render station markers on map
     */
    renderStops() {
        const stops = this.gtfsParser.getStops();
        const fares = this.gtfsParser.getFares();
        
        stops.forEach((stop, index) => {
            const isTerminal = index === 0 || index === stops.length - 1;
            
            // Create custom icon
            const icon = L.divIcon({
                className: 'custom-station-marker',
                html: `<div class="marker-dot ${isTerminal ? 'terminal' : ''}"></div>`,
                iconSize: isTerminal ? [20, 20] : [14, 14],
                iconAnchor: isTerminal ? [10, 10] : [7, 7]
            });

            // Determine fare
            let fareInfo = '';
            if (stop.zone === '2') {
                const aifaFare = fares.find(f => f.id === 'fare_aifa');
                fareInfo = aifaFare ? `${aifaFare.price.toFixed(2)} ${aifaFare.currency}` : '';
            } else {
                const intermediateFare = fares.find(f => f.id === 'fare_intermediate');
                fareInfo = intermediateFare ? `${intermediateFare.price.toFixed(2)} ${intermediateFare.currency}` : '';
            }

            // Create marker
            const marker = L.marker([stop.lat, stop.lon], { icon: icon }).addTo(this.map);

            // Function to generate popup content with updated train times
            const generatePopupContent = () => {
                // Get next trains (recalculated each time)
                const nextTrains = this.getNextTrains(index);
                
                let nextTrainInfo = '';
                if (nextTrains && nextTrains.length > 0) {
                    nextTrainInfo = '<div class="popup-next-trains">';
                    nextTrainInfo += '<div class="popup-section-title">🕐 Próximos trenes</div>';
                    nextTrainInfo += '<div class="popup-schedule-note">Horarios programados • Actualizado justo ahora</div>';
                    
                    nextTrains.forEach(train => {
                        const timeLabel = train.minutesUntil < 60 
                            ? train.minutesUntil == 0 ? 'Ahora' : `en ${train.minutesUntil} min` 
                            : `a las ${train.time}`;
                        
                        nextTrainInfo += `
                            <div class="popup-train-item">
                                <span class="popup-train-time">${train.time}</span>
                                <span class="popup-train-eta">${timeLabel}</span>
                                <span class="popup-train-direction">${train.direction}</span>
                            </div>
                        `;
                    });
                    
                    nextTrainInfo += '</div>';
                }

                return `
                    <div class="station-popup">
                        <div class="popup-station-name">${stop.name}</div>
                        <div class="popup-station-meta">Estación ${index + 1} de ${stops.length}</div>
                        ${nextTrainInfo}
                        ${fareInfo ? `
                            <div class="popup-fare-info">
                                <span class="popup-fare-label">Tarifa:</span>
                                <span class="popup-fare-value">$${fareInfo}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            };

            // Bind popup with initial content
            marker.bindPopup(generatePopupContent(), {
                className: 'custom-popup',
                maxWidth: 300
            });

            // Update popup content every time it opens
            marker.on('popupopen', () => {
                marker.setPopupContent(generatePopupContent());
            });

            this.layers.stops.push(marker);
        });
    }

    /**
     * Render sidebar with GTFS data
     */
    renderSidebar() {
        const agency = this.gtfsParser.getAgency();
        const routes = this.gtfsParser.getRoutes();
        const stops = this.gtfsParser.getStops();
        const calendar = this.gtfsParser.getCalendar();
        const frequencies = this.gtfsParser.getFrequencies();
        const fares = this.gtfsParser.getFares();

        // Agency info
        if (agency) {
            document.getElementById('agency-name').textContent = agency.name;
            document.getElementById('agency-url').href = agency.url;
        }

        // Route info
        if (routes.length > 0) {
            const route = routes[0];
            document.getElementById('route-name').textContent = route.longName;
        }

        // Stops list
        const stopsListEl = document.getElementById('stops-list');
        stopsListEl.innerHTML = '';
        
        stops.forEach((stop, index) => {
            const isTerminal = index === 0 || index === stops.length - 1;
            const li = document.createElement('li');
            li.className = 'station-item fade-in';
            li.style.animationDelay = `${index * 30}ms`;
            li.innerHTML = `
                <div class="station-marker ${isTerminal ? 'terminal' : ''}"></div>
                <div class="station-info">
                    <div class="station-name">${stop.name}</div>
                    <div class="station-sequence">Estación ${index + 1}</div>
                </div>
            `;
            
            // Add click handler
            li.addEventListener('click', () => {
                this.map.setView([stop.lat, stop.lon], 15);
                this.layers.stops[index].openPopup();
            });
            
            stopsListEl.appendChild(li);
        });

        // Schedule info
        this.renderSchedule(calendar, frequencies);

        // Fare info
        this.renderFares(fares);
    }

    /**
     * Render schedule information
     */
    renderSchedule(calendar, frequencies) {
        const scheduleGrid = document.getElementById('schedule-grid');
        
        if (calendar.length === 0 || frequencies.length === 0) return;

        const weekdayService = calendar.find(s => s.monday && !s.saturday && !s.sunday);
        const saturdayService = calendar.find(s => s.saturday);
        const sundayService = calendar.find(s => s.sunday);

        const weekdayFreq = frequencies.find(f => f.tripId.includes('weekday'));
        const saturdayFreq = frequencies.find(f => f.tripId.includes('saturday'));
        const sundayFreq = frequencies.find(f => f.tripId.includes('sunday'));

        let html = '';

        if (weekdayService && weekdayFreq) {
            html += `
                <span class="schedule-label">Lunes a Viernes:</span>
                <span class="schedule-value">${weekdayFreq.startTime.slice(0, 5)} – ${weekdayFreq.endTime === '24:00:00' ? '00:00' : weekdayFreq.endTime.slice(0, 5)}</span>
            `;
        }

        if (saturdayService && saturdayFreq) {
            html += `
                <span class="schedule-label">Sábado:</span>
                <span class="schedule-value">${saturdayFreq.startTime.slice(0, 5)} – ${saturdayFreq.endTime === '24:00:00' ? '00:00' : saturdayFreq.endTime.slice(0, 5)}</span>
            `;
        }

        if (sundayService && sundayFreq) {
            html += `
                <span class="schedule-label">Domingo:</span>
                <span class="schedule-value">${sundayFreq.startTime.slice(0, 5)} – ${sundayFreq.endTime === '24:00:00' ? '00:00' : sundayFreq.endTime.slice(0, 5)}</span>
            `;
        }

        if (weekdayFreq) {
            const headwayMin = Math.floor(weekdayFreq.headwaySecs / 60);
            html += `
                <span class="schedule-label">Frecuencia:</span>
                <span class="schedule-value">Cada ${headwayMin} min</span>
            `;
        }

        scheduleGrid.innerHTML = html;
    }

    /**
     * Render fare information
     */
    renderFares(fares) {
        const fareTableBody = document.getElementById('fare-table-body');
        fareTableBody.innerHTML = '';

        fares.forEach(fare => {
            const tr = document.createElement('tr');
            let fareType = '';
            
            if (fare.id === 'fare_intermediate') {
                fareType = 'Estaciones intermedias';
            } else if (fare.id === 'fare_aifa') {
                fareType = 'Hasta/desde AIFA';
            } else {
                fareType = fare.id;
            }

            tr.innerHTML = `
                <td>${fareType}</td>
                <td class="fare-price">$${fare.price.toFixed(2)} ${fare.currency}</td>
            `;
            fareTableBody.appendChild(tr);
        });
    }

    /**
     * Show loading screen
     */
    showLoading(message = 'Cargando...') {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = message;
        loadingScreen.classList.remove('hidden');
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 300);
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = `⚠️ ${message}`;
        loadingScreen.classList.remove('hidden');
    }
}

// Custom marker styles (injected dynamically)
const markerStyles = `
    .custom-station-marker {
        background: transparent;
        border: none;
    }
    .marker-dot {
        width: 14px;
        height: 14px;
        background: #3b82f6;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
    }
    .marker-dot:hover {
        transform: scale(1.2);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 4px 8px rgba(0, 0, 0, 0.4);
    }
    .marker-dot.terminal {
        width: 20px;
        height: 20px;
        background: #ef4444;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.7), 0 2px 6px rgba(0, 0, 0, 0.4);
    }
`;

// Inject marker styles
const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new TransitMapApp();
    app.init();
});

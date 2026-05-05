/**
 * GTFS Parser - Loads and parses GTFS CSV files
 */
class GTFSParser {
    constructor(basePath = './gtfs/') {
        this.basePath = basePath;
        this.data = {
            agency: null,
            routes: null,
            stops: null,
            trips: null,
            stopTimes: null,
            calendar: null,
            frequencies: null,
            shapes: null,
            fareAttributes: null,
            fareRules: null
        };
    }

    /**
     * Parse CSV text into array of objects
     */
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] || '';
            });
            return obj;
        });
    }

    /**
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        
        return result;
    }

    /**
     * Fetch and parse a GTFS file
     */
    async loadFile(filename) {
        try {
            const response = await fetch(`${this.basePath}${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }
            const text = await response.text();
            return this.parseCSV(text);
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return null;
        }
    }

    /**
     * Load all GTFS files
     */
    async loadAll() {
        const files = [
            { key: 'agency', file: 'agency.txt' },
            { key: 'routes', file: 'routes.txt' },
            { key: 'stops', file: 'stops.txt' },
            { key: 'trips', file: 'trips.txt' },
            { key: 'stopTimes', file: 'stop_times.txt' },
            { key: 'calendar', file: 'calendar.txt' },
            { key: 'frequencies', file: 'frequencies.txt' },
            { key: 'shapes', file: 'shapes.txt' },
            { key: 'fareAttributes', file: 'fare_attributes.txt' },
            { key: 'fareRules', file: 'fare_rules.txt' }
        ];

        const promises = files.map(async ({ key, file }) => {
            this.data[key] = await this.loadFile(file);
        });

        await Promise.all(promises);
        return this.data;
    }

    /**
     * Get route shapes as coordinate arrays
     */
    getRouteShapes() {
        if (!this.data.shapes) return {};
        
        const shapes = {};
        this.data.shapes.forEach(point => {
            const shapeId = point.shape_id;
            if (!shapes[shapeId]) {
                shapes[shapeId] = [];
            }
            shapes[shapeId].push({
                lat: parseFloat(point.shape_pt_lat),
                lon: parseFloat(point.shape_pt_lon),
                sequence: parseInt(point.shape_pt_sequence)
            });
        });
        
        // Sort by sequence
        Object.keys(shapes).forEach(shapeId => {
            shapes[shapeId].sort((a, b) => a.sequence - b.sequence);
        });
        
        return shapes;
    }

    /**
     * Get stops with parsed coordinates
     */
    getStops() {
        if (!this.data.stops) return [];
        
        return this.data.stops.map(stop => ({
            id: stop.stop_id,
            name: stop.stop_name,
            lat: parseFloat(stop.stop_lat),
            lon: parseFloat(stop.stop_lon),
            zone: stop.zone_id
        }));
    }

    /**
     * Get routes information
     */
    getRoutes() {
        if (!this.data.routes) return [];
        
        return this.data.routes.map(route => ({
            id: route.route_id,
            shortName: route.route_short_name,
            longName: route.route_long_name,
            type: parseInt(route.route_type),
            color: route.route_color ? `#${route.route_color}` : '#5d2c26',
            textColor: route.route_text_color ? `#${route.route_text_color}` : '#FFFFFF',
            url: route.route_url,
            agencyId: route.agency_id
        }));
    }

    /**
     * Get agency information
     */
    getAgency() {
        if (!this.data.agency || this.data.agency.length === 0) return null;
        
        const agency = this.data.agency[0];
        return {
            id: agency.agency_id,
            name: agency.agency_name,
            url: agency.agency_url,
            timezone: agency.agency_timezone,
            lang: agency.agency_lang,
            phone: agency.agency_phone
        };
    }

    /**
     * Get service schedules
     */
    getCalendar() {
        if (!this.data.calendar) return [];
        
        return this.data.calendar.map(service => ({
            serviceId: service.service_id,
            monday: service.monday === '1',
            tuesday: service.tuesday === '1',
            wednesday: service.wednesday === '1',
            thursday: service.thursday === '1',
            friday: service.friday === '1',
            saturday: service.saturday === '1',
            sunday: service.sunday === '1',
            startDate: service.start_date,
            endDate: service.end_date
        }));
    }

    /**
     * Get frequency information
     */
    getFrequencies() {
        if (!this.data.frequencies) return [];
        
        return this.data.frequencies.map(freq => ({
            tripId: freq.trip_id,
            startTime: freq.start_time,
            endTime: freq.end_time,
            headwaySecs: parseInt(freq.headway_secs),
            exactTimes: freq.exact_times === '1'
        }));
    }

    /**
     * Get fare information
     */
    getFares() {
        if (!this.data.fareAttributes) return [];
        
        return this.data.fareAttributes.map(fare => ({
            id: fare.fare_id,
            price: parseFloat(fare.price),
            currency: fare.currency_type,
            paymentMethod: parseInt(fare.payment_method),
            transfers: fare.transfers ? parseInt(fare.transfers) : null,
            transferDuration: fare.transfer_duration ? parseInt(fare.transfer_duration) : null
        }));
    }
}

// Export for use in other scripts
window.GTFSParser = GTFSParser;

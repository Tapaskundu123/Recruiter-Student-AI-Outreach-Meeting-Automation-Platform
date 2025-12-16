
// Basic test to verify that the route is reachable
import axios from 'axios';

async function testCalendarRoute() {
    try {
        console.log("Testing POST /api/calendar/schedule ...");
        const response = await axios.post('http://localhost:5000/api/calendar/schedule', {
            // We need a valid recruiter ID. For this test you can paste one here if you have it,
            // or the script can just fail with 400 but confirm the route exists.
            recruiterId: 'test-id',
            time: new Date().toISOString(),
            duration: 30
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Route reachable, server responded with:', error.response.status, error.response.data);
        } else {
            console.log('Network error:', error.message);
        }
    }
}

testCalendarRoute();

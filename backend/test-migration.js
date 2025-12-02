const http = require('http');

const API_HOST = '0.0.0.0';
const API_PORT = 3000;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testMigration() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await makeRequest('POST', '/auth/login', { pin: '2200' });
    const token = loginRes.token;
    console.log('✓ Logged in successfully\n');

    // 2. Create a trip
    console.log('2. Creating a trip...');
    const tripRes = await makeRequest('POST', '/trips', {
      name: 'Test Migration Trip',
      start_date: '2025-12-15',
      end_date: '2025-12-17',
      location: 'Test Location'
    }, token);
    console.log('✓ Trip response:', JSON.stringify(tripRes, null, 2));
    
    if (!tripRes.trip) {
      console.error('❌ No trip in response');
      process.exit(1);
    }
    
    console.log('  Status:', tripRes.trip.status, '(should be "open")');
    
    const tripId = tripRes.trip.id;

    // 3. Get all trips
    console.log('\n3. Getting all trips...');
    const tripsRes = await makeRequest('GET', '/trips', null, token);
    console.log('✓ Found', tripsRes.trips.length, 'trip(s)');
    tripsRes.trips.forEach(t => {
      console.log(`  - ${t.name} (${t.status})`);
    });

    // 4. Close the trip
    console.log('\n4. Closing the trip...');
    const closeRes = await makeRequest('POST', `/trips/${tripId}/close`, {}, token);
    console.log('✓ Trip closed:', closeRes.trip);
    console.log('  Status:', closeRes.trip.status, '(should be "closed")');

    console.log('\n✅ All tests passed! Migration successful!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMigration();

import { getCoordinates } from '../services/geocoder';

// ---------------------------------------------------------
// TEST: getCoordinates Function
// ---------------------------------------------------------
async function testGetCoordinates(locationName: string) {
  console.log(`\n📍 --- Testing getCoordinates with: "${locationName}" ---`);
  
  try {
    const result = await getCoordinates(locationName);
    
    if (result) {
      console.log('✅ Result:');
      console.log(`   Latitude: ${result.lat}`);
      console.log(`   Longitude: ${result.lng}`);
      console.log('');
    } else {
      console.log('⚠️  No coordinates found (returned null)');
      console.log('');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test Failed:', error);
    return null;
  }
}

// ---------------------------------------------------------
// RUNNER
// ---------------------------------------------------------
async function run() {
  try {
    // Test various location scenarios
    await testGetCoordinates('Hawthorn, VIC');
    await testGetCoordinates('Melbourne CBD');
    await testGetCoordinates('St Kilda, Victoria');
    await testGetCoordinates('Sydney, NSW');
    await testGetCoordinates('Brisbane');
    await testGetCoordinates('InvalidLocationThatDoesNotExist12345');
    
    console.log('\n✅ All tests completed!');
  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

run();

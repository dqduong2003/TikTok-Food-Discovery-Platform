import { parseSearchIntent } from '../services/gemini';

// ---------------------------------------------------------
// TEST: parseSearchIntent Function
// ---------------------------------------------------------
async function testParseSearchIntent(userQuery: string) {
  console.log(`\n🔍 --- Testing parseSearchIntent with: "${userQuery}" ---`);
  
  try {
    const result = await parseSearchIntent(userQuery);
    
    console.log('✅ Result:');
    console.log(result);
    console.log('');
    
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
    // Test various query scenarios
    await testParseSearchIntent('Bingsu in Hawthorn');
    // await testParseSearchIntent('Vietnamese food CBD');
    // await testParseSearchIntent('Cozy cafes');
    // await testParseSearchIntent('Ramen Melbourne');
    // await testParseSearchIntent('Matcha');
    // await testParseSearchIntent('Best pizza near St Kilda');
    
    console.log('\n✅ All tests completed!');
  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

run();

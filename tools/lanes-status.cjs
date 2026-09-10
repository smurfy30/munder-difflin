// Read durable records directly: Lanes' HTTP snapshot reconciles/saves runs and
// performs Git queries. It is not suitable for a passive, bounded first bridge.
const { snapshot } = require('./lanes-reader.cjs');
async function main() {
  console.log(JSON.stringify(await snapshot(), null, 2));
}
main().catch(error => { console.error(`Lanes unavailable: ${error.message}. Check LANES_ROOT and LANES_CONFIG; this does not mean no workers are active.`); process.exitCode = 1; });

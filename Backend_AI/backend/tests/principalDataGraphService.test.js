const assert = require("assert")
const { buildPrincipalGraph } = require("../services/principalDataGraphService")
;(async () => {
  const graph = await buildPrincipalGraph({ collegeId: "000000000000000000000000", depth: 2 })
  assert.ok(graph && graph.nodes && graph.edges)
  console.log("principalDataGraphService.test passed")
})()

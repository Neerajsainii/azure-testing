function makeError(code, message, status = 'error', details = undefined) {
  return { status, code, message, details }
}

function attachError(result, err) {
  return { ...result, error: err }
}

module.exports = { makeError, attachError }
